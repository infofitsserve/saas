import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const RECRUITING_ROLES = ["business_owner", "hr_admin", "recruiter", "hiring_manager"] as const;

export async function requireRecruitingWorkspace() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: membership, error } = await supabase.from("tenant_memberships")
    .select("tenant_id, role").eq("user_id", user.id).limit(1).maybeSingle();
  if (error) throw new Error("Unable to load recruiting workspace.");
  if (!membership) redirect("/app/onboarding");
  if (!RECRUITING_ROLES.includes(membership.role as (typeof RECRUITING_ROLES)[number])) {
    throw new Error("You do not have permission to access RecruitFlow AI.");
  }
  return { supabase, user, tenantId: membership.tenant_id, role: membership.role };
}
