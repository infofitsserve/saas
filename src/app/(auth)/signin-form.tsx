"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signInAction } from "@/app/(auth)/actions";
import type { AuthFormState } from "@/lib/auth/validation";

const initialState: AuthFormState = {};

export function SignInForm() {
  const [state, action, pending] = useActionState(signInAction, initialState);
  return <form action={action} className="mt-7 space-y-4">
    <label className="block text-sm font-medium">Email<input required type="email" name="email" autoComplete="email" maxLength={254} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5" /></label>
    <label className="block text-sm font-medium">Password<input required type="password" name="password" autoComplete="current-password" maxLength={128} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5" /></label>
    {state.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}
    <button disabled={pending} className="w-full rounded-lg bg-blue-700 px-4 py-3 font-semibold text-white disabled:opacity-60">{pending ? "Signing in…" : "Log in"}</button>
    <p className="text-center text-sm text-slate-600">New to Infofitsserve? <Link className="font-semibold text-blue-800 underline" href="/signup">Create an account</Link></p>
  </form>;
}
