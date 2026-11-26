"use client";

import { useActionState, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { importAttendanceAction, type ActionState } from "@/app/app/shiftpilot/actions";

type SourceRow = Record<string, unknown>;
type Fields = { employeeCode: string; workDate: string; clockIn: string; clockOut: string; shift: string };
const initial: ActionState = {};
const fieldNames: { key: keyof Fields; label: string; required: boolean }[] = [
  { key: "employeeCode", label: "Employee ID", required: true },
  { key: "workDate", label: "Work date", required: true },
  { key: "clockIn", label: "Clock-in", required: false },
  { key: "clockOut", label: "Clock-out", required: false },
  { key: "shift", label: "Shift", required: false },
];

function normalizeDate(value: unknown): string {
  if (value instanceof Date && !Number.isNaN(value.valueOf())) return value.toISOString().slice(0, 10);
  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) return `${parsed.y}-${String(parsed.m).padStart(2, "0")}-${String(parsed.d).padStart(2, "0")}`;
  }
  const text = String(value ?? "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const parsed = new Date(text);
  return text && !Number.isNaN(parsed.valueOf()) ? parsed.toISOString().slice(0, 10) : text;
}
function normalizeTime(value: unknown): string {
  if (typeof value === "number") {
    const total = Math.round(value * 24 * 60) % (24 * 60);
    return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
  }
  const text = String(value ?? "").trim();
  const match = text.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i);
  if (!match) return text;
  let hour = Number(match[1]);
  if (match[3]) hour = (hour % 12) + (match[3].toUpperCase() === "PM" ? 12 : 0);
  return `${String(hour).padStart(2, "0")}:${match[2]}`;
}

export function AttendanceImport() {
  const [state, action, pending] = useActionState(importAttendanceAction, initial);
  const [rows, setRows] = useState<SourceRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const [fields, setFields] = useState<Fields>({ employeeCode: "", workDate: "", clockIn: "", clockOut: "", shift: "" });
  const [parseError, setParseError] = useState("");

  const preview = useMemo(() => rows.slice(0, 8).map((raw, index) => ({
    rowNumber: index + 2, raw,
    employeeCode: String(raw[fields.employeeCode] ?? "").trim(),
    workDate: normalizeDate(raw[fields.workDate]),
    clockIn: normalizeTime(raw[fields.clockIn]),
    clockOut: normalizeTime(raw[fields.clockOut]),
    shift: String(raw[fields.shift] ?? "").trim(),
  })), [rows, fields]);

  async function readFile(file?: File) {
    setParseError(""); setRows([]); setHeaders([]); setFileName("");
    if (!file) return;
    if (file.size > 8_000_000) { setParseError("Files must be 8 MB or smaller."); return; }
    try {
      const bytes = await file.arrayBuffer();
      const workbook = XLSX.read(bytes, { type: "array", cellDates: true });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      if (!firstSheet) throw new Error("The workbook has no sheets.");
      const data = XLSX.utils.sheet_to_json<SourceRow>(firstSheet, { defval: "", raw: true });
      if (!data.length) throw new Error("The first sheet has no attendance rows.");
      const names = Object.keys(data[0]);
      setRows(data); setHeaders(names); setFileName(file.name);
      const find = (parts: string[]) => names.find((header) => parts.some((part) => header.toLowerCase().includes(part))) ?? "";
      setFields({ employeeCode: find(["employee id", "employee code", "staff id"]), workDate: find(["work date", "date"]), clockIn: find(["clock-in", "clock in", "check-in", "check in"]), clockOut: find(["clock-out", "clock out", "check-out", "check out"]), shift: find(["shift"]) });
    } catch (error) { setParseError(error instanceof Error ? error.message : "Unable to read this file."); }
  }

  const payload = JSON.stringify({ fileName, rows: rows.map((raw, index) => ({
    rowNumber: index + 2, raw,
    employeeCode: String(raw[fields.employeeCode] ?? "").trim(),
    workDate: normalizeDate(raw[fields.workDate]),
    clockIn: normalizeTime(raw[fields.clockIn]),
    clockOut: normalizeTime(raw[fields.clockOut]),
    shift: String(raw[fields.shift] ?? "").trim(),
  })) });

  return <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <h2 className="text-xl font-bold">Import attendance</h2>
    <p className="mt-1 text-sm leading-6 text-slate-600">Upload CSV or Excel (.xlsx/.xls), map columns, preview, then import. Every source row is retained with a status; invalid and unmatched rows are not discarded.</p>
    <label className="mt-5 block text-sm font-semibold">Attendance file<input type="file" accept=".csv,.xlsx,.xls,text/csv" onChange={(event) => void readFile(event.target.files?.[0])} className="mt-2 block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:font-semibold file:text-blue-800" /></label>
    {parseError && <p role="alert" className="mt-3 text-sm text-red-700">{parseError}</p>}
    {headers.length > 0 && <>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{fieldNames.map(({ key, label, required }) => <label key={key} className="text-sm font-medium">{label}{required && " *"}<select required={required} value={fields[key]} onChange={(event) => setFields((current) => ({ ...current, [key]: event.target.value }))} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2"><option value="">Choose column</option>{headers.map((header) => <option key={header} value={header}>{header}</option>)}</select></label>)}</div>
      <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm"><caption className="mb-2 text-left font-semibold">Preview: first {preview.length} of {rows.length} rows from {fileName}</caption><thead><tr className="border-b text-slate-500">{fieldNames.map((field) => <th key={field.key} className="px-3 py-2">{field.label}</th>)}</tr></thead><tbody>{preview.map((row) => <tr key={row.rowNumber} className="border-b last:border-0">{fieldNames.map((field) => <td key={field.key} className="px-3 py-2">{row[field.key] || <span className="text-slate-400">—</span>}</td>)}</tr>)}</tbody></table></div>
      <form action={action} className="mt-4"><input type="hidden" name="payload" value={payload} /><button disabled={pending || !fields.employeeCode || !fields.workDate} className="rounded-lg bg-blue-700 px-4 py-2.5 font-semibold text-white disabled:opacity-50">{pending ? "Saving rows…" : `Import ${rows.length} rows`}</button></form>
    </>}
    {state.error && <p role="alert" className="mt-4 text-sm text-red-700">{state.error}</p>}{state.success && <p role="status" className="mt-4 text-sm text-emerald-800">{state.success}</p>}
  </section>;
}
