import { redirect } from "next/navigation";
import { OnboardingForm } from "@/app/app/onboarding/onboarding-form";
import { getWorkspace } from "@/lib/shiftpilot/workspace";

export default async function OnboardingPage() {
  const { membership } = await getWorkspace();
  if (membership) redirect("/app/shiftpilot");
  return <main className="flex min-h-screen items-center justify-center px-5 py-12"><section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"><p className="text-sm font-bold uppercase tracking-widest text-emerald-700">ShiftPilot setup</p><h1 className="mt-3 text-2xl font-bold">Set up your business</h1><p className="mt-2 leading-6 text-slate-600">Create a secure workspace. You’ll be assigned as its business owner. Time zone is used for attendance records.</p><OnboardingForm /></section></main>;
}
