import Link from "next/link";
import { SignInForm } from "../signin-form";

export default function LoginPage() {
  return <main className="flex min-h-screen items-center justify-center px-5 py-12"><section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"><Link href="/" className="text-sm font-semibold text-blue-800">← Infofitsserve</Link><h1 className="mt-7 text-2xl font-bold">Welcome back</h1><p className="mt-2 text-sm leading-6 text-slate-600">Log in to your Infofitsserve workspace.</p><SignInForm /></section></main>;
}
