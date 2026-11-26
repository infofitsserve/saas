"use client";

import { useActionState } from "react";
import { createCandidateAction, type RecruitActionState } from "@/app/app/recruitflow/actions";
const initial: RecruitActionState = {};
export function CandidateForm() {
  const [state, action, pending] = useActionState(createCandidateAction, initial);
  return <form action={action} encType="multipart/form-data" className="space-y-3 rounded-xl bg-slate-50 p-4">
    <h3 className="font-semibold">Add candidate</h3>
    <input required name="fullName" maxLength={160} placeholder="Full name" aria-label="Candidate full name" className="w-full rounded-lg border px-3 py-2" />
    <div className="grid gap-3 sm:grid-cols-2"><input name="email" type="email" maxLength={254} placeholder="Email" aria-label="Candidate email" className="w-full rounded-lg border px-3 py-2" /><input name="phone" maxLength={50} placeholder="Phone" aria-label="Candidate phone" className="w-full rounded-lg border px-3 py-2" /></div>
    <input name="location" maxLength={160} placeholder="Location" aria-label="Candidate location" className="w-full rounded-lg border px-3 py-2" />
    <input name="skills" maxLength={2000} placeholder="Skills, comma-separated" aria-label="Candidate skills" className="w-full rounded-lg border px-3 py-2" />
    <textarea name="experienceSummary" maxLength={4000} placeholder="Experience summary (recruiter-reviewed)" aria-label="Experience summary" className="w-full rounded-lg border px-3 py-2" />
    <textarea name="resumeText" maxLength={20000} placeholder="Resume text (manually entered/reviewed; extraction not configured)" aria-label="Resume text" className="w-full rounded-lg border px-3 py-2" />
    <label className="block text-sm">Resume file (PDF, DOC, DOCX, TXT; max 10 MB)<input name="resume" type="file" accept=".pdf,.doc,.docx,.txt,application/pdf,text/plain" className="mt-1 block w-full text-sm" /></label>
    <label className="flex gap-2 text-sm leading-5"><input name="consent" type="checkbox" className="mt-1" />Candidate consent to store and process resume recorded</label>
    <label className="block text-sm">Retention until (optional)<input name="retentionUntil" type="date" className="mt-1 block rounded-lg border px-3 py-2" /></label>
    <button disabled={pending} className="rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white">{pending ? "Saving…" : "Save candidate"}</button>
    {state.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}{state.success && <p role="status" className="text-sm text-emerald-800">{state.success}</p>}
  </form>;
}
