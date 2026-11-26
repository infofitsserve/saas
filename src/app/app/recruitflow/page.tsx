import { getWorkspace } from "@/lib/shiftpilot/workspace";
import { redirect } from "next/navigation";
import { RECRUITING_ROLES } from "@/lib/recruitflow/workspace";
import { ClientForm } from "@/app/app/recruitflow/client-form";
import { JobForm } from "@/app/app/recruitflow/job-form";
import { CandidateForm } from "@/app/app/recruitflow/candidate-form";
import { ApplicationForm } from "@/app/app/recruitflow/application-form";

export default async function RecruitFlowPage() {
  const { supabase, membership } = await getWorkspace();
  if (!membership) redirect("/app/onboarding");
  if (!RECRUITING_ROLES.includes(membership.role as (typeof RECRUITING_ROLES)[number])) redirect("/app/shiftpilot");
  const tenantId = membership.tenant_id;
  const [{ data: tenant }, { data: jobs }, { data: clients }, { data: candidates }, { data: applications }, { data: interviews }, { data: stages }] = await Promise.all([
    supabase.from("tenants").select("name").eq("id", tenantId).single(),
    supabase.from("recruit_jobs").select("id,title,location,status,required_skills").eq("tenant_id", tenantId).order("created_at", { ascending: false }).limit(200),
    supabase.from("recruit_clients").select("id,name,contact_name,contact_email").eq("tenant_id", tenantId).order("name").limit(200),
    supabase.from("recruit_candidates").select("id,full_name,email,location,skills,experience_summary,resume_path,retention_until,deletion_requested_at").eq("tenant_id", tenantId).order("created_at", { ascending: false }).limit(200),
    supabase.from("recruit_applications").select("id,stage_id,human_decision,match_suggestion,created_at,recruit_jobs(title),recruit_candidates(full_name),recruit_stages(name)").eq("tenant_id", tenantId).order("created_at", { ascending: false }).limit(500),
    supabase.from("recruit_interviews").select("id,scheduled_at,duration_minutes,location_or_link").eq("tenant_id", tenantId).gte("scheduled_at", new Date().toISOString()).order("scheduled_at").limit(100),
    supabase.from("recruit_stages").select("id,name,sort_order").eq("tenant_id", tenantId).order("sort_order"),
  ]);
  const appItems = applications ?? [];
  const activeJobs = jobs?.filter((job) => job.status === "open").length ?? 0;
  const hired = appItems.filter((application) => application.human_decision === "hired").length;
  const conversion = appItems.length ? Math.round((hired / appItems.length) * 100) : 0;
  const counts = new Map((stages ?? []).map((stage) => [stage.id, { name: stage.name, count: 0 }]));
  for (const application of appItems) counts.get(application.stage_id)?.count++;
  const { data: currentUser } = await supabase.auth.getUser();
  const resumeCandidates = (candidates ?? []).filter((candidate) => candidate.resume_path);
  const resumeLinks = await Promise.all(resumeCandidates.map(async (candidate) => {
    const result = await supabase.storage.from("recruit-resumes").createSignedUrl(candidate.resume_path!, 60);
    return [candidate.id, result.data?.signedUrl ?? null] as const;
  }));
  const resumeUrlMap = new Map(resumeLinks);

  return <main className="min-h-screen bg-slate-50"><header className="border-b bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4"><div><a href="/" className="text-lg font-bold">infofitsserve<span className="text-emerald-700">.</span></a><p className="text-xs text-slate-500">RecruitFlow AI · {tenant?.name ?? "Workspace"}</p></div><div className="text-right text-sm"><span className="rounded-full bg-blue-50 px-3 py-1 font-medium text-blue-800">{membership.role.replaceAll("_", " ")}</span><p className="mt-2 text-xs text-slate-500">{currentUser.user?.email}</p></div></div></header>
    <div className="mx-auto max-w-7xl space-y-8 px-5 py-8"><section><p className="text-sm font-bold uppercase tracking-widest text-emerald-700">Recruitment workspace</p><h1 className="mt-2 text-3xl font-bold">RecruitFlow AI</h1><p className="mt-2 text-slate-600">A tenant-isolated recruitment workspace. Matching is a transparent keyword suggestion only; every hiring decision stays with your team.</p></section>
      <section className="grid gap-4 grid-cols-2 lg:grid-cols-4">{[["Active vacancies",activeJobs],["Candidates",candidates?.length??0],["Applications",appItems.length],["Interviews scheduled",interviews?.length??0],["Offers made",appItems.filter(a=>a.human_decision==="shortlisted").length],["Hiring conversion",`${conversion}%`]].map(([label,value])=><article key={String(label)} className="rounded-2xl border bg-white p-5"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold">{value}</p></article>)}</section>
      <section className="grid gap-5 lg:grid-cols-3"><div className="rounded-2xl border bg-white p-5"><h2 className="mb-4 text-xl font-bold">Client database</h2><ClientForm/><ul className="mt-4 divide-y">{clients?.map((client)=><li key={client.id} className="py-3"><p className="font-semibold">{client.name}</p><p className="text-sm text-slate-500">{client.contact_name||client.contact_email||"No contact added"}</p></li>)}{!clients?.length&&<li className="py-4 text-sm text-slate-500">No clients yet.</li>}</ul></div>
      <div className="rounded-2xl border bg-white p-5"><h2 className="mb-4 text-xl font-bold">Job requisitions</h2><JobForm clients={clients??[]}/><ul className="mt-4 divide-y">{jobs?.map((job)=><li key={job.id} className="py-3"><div className="flex justify-between gap-2"><p className="font-semibold">{job.title}</p><span className="text-xs text-slate-500">{job.status}</span></div><p className="text-sm text-slate-500">{job.location||"Location not specified"}</p></li>)}{!jobs?.length&&<li className="py-4 text-sm text-slate-500">No vacancies yet.</li>}</ul></div>
      <div className="rounded-2xl border bg-white p-5"><h2 className="mb-4 text-xl font-bold">Candidate database</h2><CandidateForm/><ul className="mt-4 divide-y">{candidates?.map((candidate)=><li key={candidate.id} className="py-3"><p className="font-semibold">{candidate.full_name}</p><p className="text-sm text-slate-500">{[candidate.location,candidate.email].filter(Boolean).join(" · ")||"No contact details"}</p><p className="mt-1 text-xs text-slate-600">{candidate.skills.join(", ")||"No skills entered"}{candidate.retention_until?` · Retain until ${candidate.retention_until}`:""}</p>{candidate.deletion_requested_at&&<p className="text-xs text-amber-800">Deletion request recorded</p>}{resumeUrlMap.get(candidate.id)&&<a className="text-sm text-blue-800 underline" href={resumeUrlMap.get(candidate.id)!} target="_blank" rel="noreferrer">Open private resume (1-minute link)</a>}</li>)}{!candidates?.length&&<li className="py-4 text-sm text-slate-500">No candidates yet.</li>}</ul></div></section>
      <section className="rounded-2xl border bg-white p-6"><h2 className="text-xl font-bold">Pipeline</h2><div className="mt-4 grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">{Array.from(counts.values()).map((stage)=><div key={stage.name} className="rounded-xl bg-slate-50 p-4"><p className="text-sm text-slate-500">{stage.name}</p><p className="mt-1 text-2xl font-bold">{stage.count}</p></div>)}</div><div className="mt-6"><h3 className="font-semibold">Add application</h3><div className="mt-3"><ApplicationForm candidates={(candidates??[]).map(({id,full_name})=>({id,full_name}))} jobs={(jobs??[]).filter(job=>job.status==="open").map(({id,title})=>({id,title}))}/></div></div><div className="mt-6 overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead><tr className="border-b text-slate-500">{["Candidate","Vacancy","Pipeline stage","Human decision","Skills suggestion"].map((heading)=><th key={heading} className="px-3 py-2">{heading}</th>)}</tr></thead><tbody>{appItems.map((app:any)=><tr key={app.id} className="border-b"><td className="px-3 py-3">{app.recruit_candidates?.full_name}</td><td className="px-3 py-3">{app.recruit_jobs?.title}</td><td className="px-3 py-3">{app.recruit_stages?.name}</td><td className="px-3 py-3">{app.human_decision.replaceAll("_"," ")}</td><td className="px-3 py-3">{(app.match_suggestion?.matched_skills??[]).join(", ")||"No overlap detected"}</td></tr>)}{!appItems.length&&<tr><td colSpan={5} className="px-3 py-8 text-center text-slate-500">No applications yet. Add a candidate and vacancy to get started.</td></tr>}</tbody></table></div></section>
      <section className="rounded-2xl border bg-white p-6"><h2 className="text-xl font-bold">Upcoming interviews</h2>{interviews?.length?<ul className="mt-3 grid gap-3 sm:grid-cols-2">{interviews.map((interview)=><li key={interview.id} className="rounded-xl bg-slate-50 p-4"><p className="font-semibold">{new Date(interview.scheduled_at).toLocaleString()}</p><p className="text-sm text-slate-600">{interview.duration_minutes} min · {interview.location_or_link||"Location to be confirmed"}</p></li>)}</ul>:<p className="mt-2 text-sm text-slate-500">No upcoming interviews are scheduled.</p>}</section>
      <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">Resume text extraction, configurable pipeline editing, interview scheduling forms, client reports, and AI model integration are not enabled. Skill overlap is a recruiter-review suggestion, never an automated rejection or shortlist. Sensitive attributes are not collected for matching.</p>
    </div></main>;
}
