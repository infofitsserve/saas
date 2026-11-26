"use client";

import { useActionState } from "react";
import { createEmployeeAction, type ActionState } from "@/app/app/shiftpilot/actions";

const initial: ActionState = {};
export function EmployeeForm() {
  const [state, action, pending] = useActionState(createEmployeeAction, initial);
  return <form action={action} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-4">
    <label className="text-sm font-medium">Employee ID<input required name="employeeCode" maxLength={80} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
    <label className="text-sm font-medium">Full name<input required name="fullName" maxLength={160} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
    <label className="text-sm font-medium">Email<input name="email" type="email" maxLength={254} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
    <label className="text-sm font-medium">Department<input name="department" maxLength={120} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
    <div className="sm:col-span-2 lg:col-span-4"><button disabled={pending} className="rounded-lg bg-emerald-700 px-4 py-2.5 font-semibold text-white disabled:opacity-60">{pending ? "Adding…" : "Add employee"}</button>{state.error && <p role="alert" className="mt-2 text-sm text-red-700">{state.error}</p>}{state.success && <p role="status" className="mt-2 text-sm text-emerald-800">{state.success}</p>}</div>
  </form>;
}
