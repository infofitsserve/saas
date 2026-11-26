import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AppPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return <main className="mx-auto min-h-screen max-w-4xl px-6 py-16"><p className="text-sm font-bold uppercase tracking-widest text-emerald-700">Infofitsserve workspace</p><h1 className="mt-3 text-3xl font-bold">You’re signed in</h1><p className="mt-3 text-slate-600">Your account is authenticated. Tenant onboarding and product dashboards are not part of this foundation yet.</p></main>;
}
