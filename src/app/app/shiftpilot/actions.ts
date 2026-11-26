"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { businessSchema, employeeSchema, attendanceImportSchema } from "@/lib/shiftpilot/validation";
import { getWorkspace, requireHrWorkspace } from "@/lib/shiftpilot/workspace";

export type ActionState = { error?: string; success?: string };

export async function provisionBusinessAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = businessSchema.safeParse({ name: formData.get("name"), timezone: formData.get("timezone") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check business details." };
  const { supabase, user } = await getWorkspace();
  if (!user) return { error: "Please sign in first." };
  const { error } = await supabase.rpc("provision_business", { p_name: parsed.data.name, p_timezone: parsed.data.timezone });
  if (error) return { error: "Unable to create the business workspace. Please check the details and try again." };
  revalidatePath("/app");
  redirect("/app/shiftpilot");
}

export async function createEmployeeAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = employeeSchema.safeParse({
    employeeCode: formData.get("employeeCode"), fullName: formData.get("fullName"),
    email: formData.get("email") ?? "", department: formData.get("department") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check employee details." };
  const { supabase, tenantId } = await requireHrWorkspace();

  let departmentId: string | null = null;
  if (parsed.data.department) {
    const { data: department, error: departmentError } = await supabase.from("departments")
      .upsert({ tenant_id: tenantId, name: parsed.data.department }, { onConflict: "tenant_id,name" })
      .select("id").single();
    if (departmentError) return { error: "Unable to save that department." };
    departmentId = department.id;
  }
  const { error } = await supabase.from("employees").insert({
    tenant_id: tenantId, employee_code: parsed.data.employeeCode, full_name: parsed.data.fullName,
    email: parsed.data.email || null, department_id: departmentId,
  });
  if (error) return { error: error.code === "23505" ? "That employee ID already exists in this business." : "Unable to add employee." };
  await supabase.from("audit_logs").insert({ tenant_id: tenantId, actor_user_id: (await supabase.auth.getUser()).data.user?.id, action: "employee.created", resource_type: "employee", metadata: { employee_code: parsed.data.employeeCode } });
  revalidatePath("/app/shiftpilot");
  return { success: "Employee added." };
}

function parseLocalDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

function parseTime(value: string) {
  return /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(value);
}

export async function importAttendanceAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const json = formData.get("payload");
  if (typeof json !== "string" || json.length > 8_000_000) return { error: "The import file is too large or invalid." };
  let value: unknown;
  try { value = JSON.parse(json); } catch { return { error: "Could not read the import preview." }; }
  const parsed = attendanceImportSchema.safeParse(value);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Import data is invalid." };

  const { supabase, tenantId, user } = await requireHrWorkspace();
  const { data: employees, error: employeeError } = await supabase.from("employees")
    .select("id, employee_code").eq("tenant_id", tenantId).eq("status", "active");
  if (employeeError) return { error: "Unable to match employee IDs." };
  const employeeMap = new Map((employees ?? []).map((employee) => [employee.employee_code.toLowerCase(), employee.id]));
  const inFile = new Set<string>();
  const prepared = parsed.data.rows.map((row) => {
    const code = row.employeeCode.trim();
    const date = row.workDate.trim();
    const clockIn = row.clockIn.trim();
    const clockOut = row.clockOut.trim();
    const employeeId = employeeMap.get(code.toLowerCase());
    let status: "ready" | "unmatched" | "invalid" | "duplicate" = "ready";
    let message: string | null = null;
    if (!employeeId) { status = "unmatched"; message = "No active employee has this ID."; }
    else if (!parseLocalDate(date) || (clockIn && !parseTime(clockIn)) || (clockOut && !parseTime(clockOut)) || (!clockIn && !clockOut)) {
      status = "invalid"; message = "Use a real YYYY-MM-DD date and 24-hour times; provide at least one punch.";
    } else {
      const duplicateKey = `${employeeId}:${date}`;
      if (inFile.has(duplicateKey)) { status = "duplicate"; message = "Another row in this file has the same employee and work date."; }
      inFile.add(duplicateKey);
    }
    return { row, code, date, clockIn, clockOut, employeeId, status, message };
  });

  const { data: batch, error: batchError } = await supabase.from("attendance_imports").insert({
    tenant_id: tenantId, created_by: user.id, source_name: parsed.data.fileName, total_rows: prepared.length,
  }).select("id").single();
  if (batchError || !batch) return { error: "Could not create the attendance import." };

  const sourceRows = prepared.map((item) => ({
    tenant_id: tenantId, import_id: batch.id, row_number: item.row.rowNumber, raw_data: item.row.raw,
    employee_code: item.code || null, work_date_text: item.date || null,
    clock_in_text: item.clockIn || null, clock_out_text: item.clockOut || null,
    shift_name: item.row.shift.trim() || null, status: item.status, message: item.message,
  }));
  const { data: storedRows, error: rowsError } = await supabase.from("attendance_import_rows")
    .insert(sourceRows).select("id, row_number");
  if (rowsError || !storedRows) return { error: "Import batch created, but source rows could not be saved. No attendance rows were imported." };

  const rowIds = new Map(storedRows.map((row) => [row.row_number, row.id]));
  let imported = 0;
  for (const item of prepared) {
    if (item.status !== "ready" || !item.employeeId) continue;
    const timezone = await supabase.from("tenant_settings").select("timezone").eq("tenant_id", tenantId).single();
    if (timezone.error) return { error: "Import rows are saved; business time zone could not be loaded. No more rows were processed." };
    const start = item.clockIn ? `${item.date} ${item.clockIn}` : null;
    let end = item.clockOut ? `${item.date} ${item.clockOut}` : null;
    if (start && end && item.clockOut <= item.clockIn) {
      const next = new Date(`${item.date}T00:00:00Z`);
      next.setUTCDate(next.getUTCDate() + 1);
      end = `${next.toISOString().slice(0, 10)} ${item.clockOut}`;
    }
    const { data: record, error: recordError } = await supabase.from("attendance_records").insert({
      tenant_id: tenantId, employee_id: item.employeeId, work_date: item.date,
      clock_in: start ? new Date(`${start}:00`).toLocaleString("en-US", { timeZone: timezone.data.timezone }) : null,
      clock_out: end ? new Date(`${end}:00`).toLocaleString("en-US", { timeZone: timezone.data.timezone }) : null,
      import_id: batch.id, source: "import",
    }).select("id").single();
    if (recordError || !record) {
      const status = recordError.code === "23505" ? "duplicate" : "invalid";
      await supabase.from("attendance_import_rows").update({ status, message: status === "duplicate" ? "Attendance already exists for this employee and work date." : "Could not save this attendance record." }).eq("id", rowIds.get(item.row.rowNumber)).eq("tenant_id", tenantId);
      continue;
    }
    await supabase.from("attendance_import_rows").update({ status: "imported", message: null }).eq("id", rowIds.get(item.row.rowNumber)).eq("tenant_id", tenantId);
    imported++;
  }
  await supabase.from("audit_logs").insert({ tenant_id: tenantId, actor_user_id: user.id, action: "attendance.imported", resource_type: "attendance_import", resource_id: batch.id, metadata: { total_rows: prepared.length, imported_rows: imported } });
  revalidatePath("/app/shiftpilot");
  return { success: `Import reviewed: ${imported} attendance row(s) saved. Unmatched, invalid, and duplicate rows remain in the import history for review.` };
}
