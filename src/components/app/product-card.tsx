import Link from "next/link";

type ProductCardProps = {
  name: string;
  description: string;
  href: string;
  initials: string;
  accent: "blue" | "green";
  features: string[];
};

const accentClasses = {
  blue: { icon: "bg-blue-100 text-blue-800", link: "text-blue-800" },
  green: { icon: "bg-emerald-100 text-emerald-800", link: "text-emerald-800" },
};

export function ProductCard({ name, description, href, initials, accent, features }: ProductCardProps) {
  const classes = accentClasses[accent];
  return (
    <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start gap-4">
        <div aria-hidden="true" className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl font-bold ${classes.icon}`}>{initials}</div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">{name}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        </div>
      </div>
      <ul className="my-6 flex-1 space-y-2 text-sm text-slate-600">
        {features.map((feature) => <li key={feature} className="flex gap-2"><span aria-hidden="true" className="text-emerald-700">✓</span>{feature}</li>)}
      </ul>
      <Link href={href} className={`inline-flex items-center gap-2 font-semibold hover:underline ${classes.link}`}>
        Open {name}<span aria-hidden="true">→</span>
      </Link>
    </article>
  );
}
