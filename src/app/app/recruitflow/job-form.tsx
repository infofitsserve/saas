"use client";

import { useActionState } from "react";
import { createJobAction, type RecruitActionState } from "@/app/app/recruitflow/actions";
const initial: RecruitActionState = {};
export function JobForm({ clients }: { clients: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(createJobAction, initial);
  return <form action={action} className="space-y-3 rounded-xl bg-slate-50 p-4">
    <h3 className="font-semibold">Open a vacancy</h3>
    <input required name="title" maxLength={160} placeholder="Job title" aria-label="Job title" className="w-full rounded-lg border px-3 py-2" />
    <input name="location" maxLength={160} placeholder="Location or remote" aria-label="Job location" className="w-full rounded-lg border px-3 py-2" />
    <select name="clientId" defaultValue="" aria-label="Client" className="w-full rounded-lg border bg-white px-3 py-2"><option value="">No client linked</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select>
    <input name="skills" maxLength={2000} placeholder="Required skills, comma-separated" aria-label="Required skills" className="w-full rounded-lg border px-3 py-2" />
    <textarea name="description" maxLength={10000} placeholder="Job description" aria-label="Job description" className="w-full rounded-lg border px-3 py-2" />
    <button disabled={pending} className="rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white">{pending ? "Saving…" : "Create vacancy"}</button>
    {state.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}{state.success && <p role="status" className="text-sm text-emerald-800">{state.success}</p>}
  </form>;
}
