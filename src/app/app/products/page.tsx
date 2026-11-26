import { redirect } from "next/navigation";
import { ProductCard } from "@/components/app/product-card";
import { getWorkspace } from "@/lib/shiftpilot/workspace";

export default async function ProductSelectionPage() {
  const { supabase, membership } = await getWorkspace();
  if (!membership) redirect("/app/onboarding");
  const { data: tenant } = await supabase.from("tenants").select("name").eq("id", membership.tenant_id).single();

  return (
    <main className="space-y-8">
      <section className="rounded-3xl bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 px-6 py-9 text-white sm:px-9 sm:py-12">
        <p className="text-sm font-semibold uppercase tracking-[.16em] text-emerald-300">Your products</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Choose a workspace</h1>
        <p className="mt-3 max-w-2xl leading-7 text-blue-100">Open a product for {tenant?.name ?? "your business"}. Your team and organization are managed in one shared account.</p>
      </section>
      <section aria-label="Available products" className="grid gap-5 lg:grid-cols-2">
        <ProductCard name="ShiftPilot" initials="SP" accent="blue" href="/app/shiftpilot"
          description="Coordinate employee attendance and workforce operations in a focused workspace."
          features={["Employee directory and attendance imports", "Built for clear, reviewable workforce workflows", "Tenant-scoped workspace"]} />
        <ProductCard name="RecruitFlow AI" initials="RF" accent="green" href="/app/recruitflow"
          description="Manage recruitment clients, vacancies, candidates, and application pipelines."
          features={["Client and job requisition management", "Candidate records and application pipeline", "Human-reviewed matching suggestions"]} />
      </section>
      <p className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-950">Product access and features depend on your workspace permissions and configured services. Payment and AI provider integrations are not part of this foundation.</p>
    </main>
  );
}
