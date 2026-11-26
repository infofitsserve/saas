"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUpAction } from "@/app/(auth)/actions";
import type { AuthFormState } from "@/lib/auth/validation";

const initialState: AuthFormState = {};

export function SignUpForm() {
  const [state, action, pending] = useActionState(signUpAction, initialState);
  return <form action={action} className="mt-7 space-y-4">
    <label className="block text-sm font-medium">Full name<input required name="fullName" autoComplete="name" maxLength={120} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5" /></label>
    <label className="block text-sm font-medium">Work email<input required type="email" name="email" autoComplete="email" maxLength={254} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5" /></label>
    <label className="block text-sm font-medium">Password<input required type="password" name="password" autoComplete="new-password" minLength={12} maxLength={128} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5" /><span className="mt-1 block text-xs text-slate-500">At least 12 characters.</span></label>
    {state.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}
    {state.success && <p role="status" className="text-sm text-emerald-800">{state.success}</p>}
    <button disabled={pending} className="w-full rounded-lg bg-blue-700 px-4 py-3 font-semibold text-white disabled:opacity-60">{pending ? "Creating account…" : "Create account"}</button>
    <p className="text-center text-sm text-slate-600">Already registered? <Link className="font-semibold text-blue-800 underline" href="/login">Log in</Link></p>
  </form>;
}
