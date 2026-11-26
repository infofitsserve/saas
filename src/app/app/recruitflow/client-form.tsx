"use client";

import { useActionState } from "react";
import { createClientAction, type RecruitActionState } from "@/app/app/recruitflow/actions";
const initial: RecruitActionState = {};
export function ClientForm() {
  const [state, action, pending] = useActionState(createClientAction, initial);
  return <form action={action} className="space-y-3 rounded-xl bg-slate-50 p-4">
    <h3 className="font-semibold">Add client</h3>
    <input required name="name" maxLength={160} placeholder="Agency client name" aria-label="Client name" className="w-full rounded-lg border px-3 py-2" />
    <input name="contactName" maxLength={120} placeholder="Contact name" aria-label="Contact name" className="w-full rounded-lg border px-3 py-2" />
    <input name="contactEmail" type="email" maxLength={254} placeholder="Contact email" aria-label="Contact email" className="w-full rounded-lg border px-3 py-2" />
    <textarea name="notes" maxLength={2000} placeholder="Notes" aria-label="Client notes" className="w-full rounded-lg border px-3 py-2" />
    <button disabled={pending} className="rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white">{pending ? "Saving…" : "Save client"}</button>
    {state.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}{state.success && <p role="status" className="text-sm text-emerald-800">{state.success}</p>}
  </form>;
}
