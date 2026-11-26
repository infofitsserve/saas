import Link from "next/link";
import { SignUpForm } from "../signup-form";

export default function SignUpPage() {
  return <main className="flex min-h-screen items-center justify-center px-5 py-12"><section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"><Link href="/" className="text-sm font-semibold text-blue-800">← Infofitsserve</Link><h1 className="mt-7 text-2xl font-bold">Create your account</h1><p className="mt-2 text-sm leading-6 text-slate-600">Start with a secure account. Business setup and product access come next.</p><SignUpForm /></section></main>;
}
