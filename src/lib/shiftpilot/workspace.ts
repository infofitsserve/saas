import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const HR_ROLES = ["business_owner", "hr_admin"] as const;

export async function getWorkspace() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: membership, error } = await supabase
    .from("tenant_memberships")
    .select("tenant_id, role, tenants(name)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (error) throw new Error("Unable to load your workspace.");
  return { supabase, user, membership };
}

export async function requireHrWorkspace() {
  const workspace = await getWorkspace();
  if (!workspace.membership) redirect("/app/onboarding");
  if (!HR_ROLES.includes(workspace.membership.role as (typeof HR_ROLES)[number])) {
    throw new Error("You do not have permission to manage attendance.");
  }
  return { ...workspace, tenantId: workspace.membership.tenant_id };
}
