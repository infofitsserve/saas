import { redirect } from "next/navigation";
import { getWorkspace } from "@/lib/shiftpilot/workspace";

export default async function AppPage() {
  const { membership } = await getWorkspace();
  if (!membership) redirect("/app/onboarding");
  redirect("/app/shiftpilot");
}
