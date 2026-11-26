import Link from "next/link";
import { redirect } from "next/navigation";
import { getWorkspace } from "@/lib/shiftpilot/workspace";

function SummaryCard({ label, value, note }: { label: string; value: string; note: string }) {
  return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <p className="text-sm font-medium text-slate-500">{label}</p>
    <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
    <p className="mt-2 text-xs text-slate-500">{note}</p>
  </article>;
}

export default async function WorkspaceOverviewPage() {
  const { supabase, membership, user } = await getWorkspace();
  if (!membership) redirect("/app/onboarding");
  const tenantId = membership.tenant_id;
  const [tenantResult, employeeResult, jobResult, applicationResult] = await Promise.all([
    supabase.from("tenants").select("name").eq("id", tenantId).single(),
    supabase.from("employees").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId).eq("status", "active"),
    supabase.from("recruit_jobs").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId).eq("status", "open"),
    supabase.from("recruit_applications").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
  ]);
  const name = user.user_metadata?.full_name || user.email || "there";

  return (
    <main className="space-y-8">
      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-[.15em] text-emerald-700">Workspace overview</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Welcome, {name}</h1>
          <p className="mt-2 text-slate-600">{tenantResult.data?.name ?? "Your business"} · {membership.role.replaceAll("_", " ")}</p>
        </div>
        <Link href="/app/products" className="inline-flex w-fit items-center justify-center rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">Browse products</Link>
      </section>
      <section aria-label="Workspace summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard label="Active employees" value={employeeResult.count === null ? "—" : String(employeeResult.count)} note="ShiftPilot · current workspace" />
        <SummaryCard label="Open vacancies" value={jobResult.count === null ? "—" : String(jobResult.count)} note="RecruitFlow AI · current workspace" />
        <SummaryCard label="Applications" value={applicationResult.count === null ? "—" : String(applicationResult.count)} note="RecruitFlow AI · current workspace" />
      </section>
      <section>
        <div className="mb-4"><h2 className="text-xl font-bold text-slate-900">Continue to a product</h2><p className="mt-1 text-sm text-slate-600">Open the module your team needs.</p></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Link href="/app/shiftpilot" className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md">
            <p className="text-sm font-semibold text-blue-800">SHIFTPILOT</p><h3 className="mt-2 text-lg font-bold">Attendance workspace</h3><p className="mt-2 text-sm leading-6 text-slate-600">Open the employee directory and attendance tools.</p><span className="mt-4 inline-block text-sm font-semibold text-blue-800 group-hover:underline">Open ShiftPilot →</span>
          </Link>
          <Link href="/app/recruitflow" className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow-md">
            <p className="text-sm font-semibold text-emerald-800">RECRUITFLOW AI</p><h3 className="mt-2 text-lg font-bold">Recruitment workspace</h3><p className="mt-2 text-sm leading-6 text-slate-600">Open client, vacancy, candidate, and application tools.</p><span className="mt-4 inline-block text-sm font-semibold text-emerald-800 group-hover:underline">Open RecruitFlow AI →</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
