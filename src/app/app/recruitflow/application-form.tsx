"use client";

import { useActionState } from "react";
import { createApplicationAction, type RecruitActionState } from "@/app/app/recruitflow/actions";
const initial: RecruitActionState = {};
export function ApplicationForm({ candidates, jobs }: { candidates: { id: string; full_name: string }[]; jobs: { id: string; title: string }[] }) {
  const [state, action, pending] = useActionState(createApplicationAction, initial);
  return <form action={action} className="grid gap-3 sm:grid-cols-3">
    <select required name="candidateId" defaultValue="" aria-label="Candidate" className="rounded-lg border bg-white px-3 py-2"><option value="">Select candidate</option>{candidates.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.full_name}</option>)}</select>
    <select required name="jobId" defaultValue="" aria-label="Vacancy" className="rounded-lg border bg-white px-3 py-2"><option value="">Select vacancy</option>{jobs.map((job) => <option key={job.id} value={job.id}>{job.title}</option>)}</select>
    <button disabled={pending || !candidates.length || !jobs.length} className="rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white disabled:opacity-50">{pending ? "Adding…" : "Create application"}</button>
    {state.error && <p role="alert" className="text-sm text-red-700 sm:col-span-3">{state.error}</p>}{state.success && <p role="status" className="text-sm text-emerald-800 sm:col-span-3">{state.success}</p>}
  </form>;
}
