import Link from "next/link";

const products = [
  { name: "ShiftPilot", description: "Plan shifts, track attendance, and keep teams coordinated.", mark: "SP" },
  { name: "RecruitFlow AI", description: "Organize recruitment pipelines with AI-assisted screening workflows.", mark: "RF" },
];

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="text-lg font-bold tracking-tight">infofitsserve<span className="text-emerald-700">.</span></Link>
        <nav aria-label="Main navigation" className="flex items-center gap-5 text-sm">
          <a className="hidden sm:inline" href="#products">Products</a>
          <Link className="rounded-lg border border-slate-300 px-4 py-2 font-semibold" href="/login">Log in</Link>
          <Link className="rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white" href="/signup">Get started</Link>
        </nav>
      </header>
      <section className="mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-[1.2fr_.8fr] md:items-center md:py-28">
        <div>
          <p className="mb-5 text-sm font-bold uppercase tracking-[.18em] text-emerald-700">People operations, made clearer</p>
          <h1 className="max-w-3xl text-5xl font-bold leading-tight tracking-tight md:text-6xl">A better way to support every stage of work.</h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">One trusted workspace for workforce coordination and thoughtful hiring—built for growing teams.</p>
          <div className="mt-8 flex flex-wrap gap-3"><Link className="rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white" href="/signup">Create an account</Link><a className="rounded-lg border border-slate-300 px-5 py-3 font-semibold" href="#products">Explore products</a></div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"><p className="text-sm font-semibold text-slate-500">THE INFOFITSERVE PLATFORM</p><div className="mt-6 space-y-4">{products.map((product) => <article key={product.name} className="flex gap-4 rounded-2xl bg-slate-50 p-5"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 font-bold text-blue-800">{product.mark}</span><div><h2 className="font-bold">{product.name}</h2><p className="mt-1 text-sm leading-6 text-slate-600">{product.description}</p></div></article>)}</div></div>
      </section>
      <section id="products" className="border-t border-slate-200 bg-white"><div className="mx-auto max-w-6xl px-6 py-16"><p className="text-sm font-bold uppercase tracking-widest text-emerald-700">Two focused products</p><h2 className="mt-3 text-3xl font-bold">Tools designed around your people.</h2><div className="mt-8 grid gap-5 md:grid-cols-2">{products.map((product) => <article key={product.name} className="rounded-2xl border border-slate-200 p-6"><h3 className="text-xl font-bold">{product.name}</h3><p className="mt-3 leading-7 text-slate-600">{product.description}</p></article>)}</div></div></section>
      <footer className="mx-auto max-w-6xl px-6 py-8 text-sm text-slate-500">© {new Date().getFullYear()} Infofitsserve Consultant Services</footer>
    </main>
  );
}
