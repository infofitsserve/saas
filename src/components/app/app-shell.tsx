import Link from "next/link";

const links = [
  { href: "/app/overview", label: "Overview" },
  { href: "/app/products", label: "Products" },
  { href: "/app/shiftpilot", label: "ShiftPilot" },
  { href: "/app/recruitflow", label: "RecruitFlow AI" },
];

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/app/overview" className="shrink-0 text-lg font-bold tracking-tight text-slate-900">
            infofitsserve<span className="text-emerald-600">.</span>
            <span className="ml-2 hidden text-xs font-medium text-slate-500 sm:inline">WORKSPACE</span>
          </Link>
          <nav aria-label="Workspace navigation" className="hidden items-center gap-1 md:flex">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-blue-50 hover:text-blue-800">
                {link.label}
              </Link>
            ))}
          </nav>
          <details className="relative md:hidden">
            <summary aria-label="Open workspace navigation" className="cursor-pointer list-none rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">
              Menu <span aria-hidden="true">☰</span>
            </summary>
            <nav aria-label="Mobile workspace navigation" className="absolute right-0 top-12 z-40 grid min-w-52 gap-1 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
              {links.map((link) => (
                <Link key={link.href} href={link.href} className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-800">
                  {link.label}
                </Link>
              ))}
            </nav>
          </details>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-5 text-xs text-slate-500 sm:px-6 lg:px-8">
          Infofitsserve Consultant Services · Secure people operations
        </div>
      </footer>
    </div>
  );
}
