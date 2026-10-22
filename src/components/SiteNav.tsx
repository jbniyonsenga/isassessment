"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "Home" },
  { href: "/methodology", label: "How it works" },
  { href: "/privacy", label: "Privacy" },
  { href: "/contact", label: "Contact us" },
];

/** Highlights the current page. Reads the URL, so it renders inside <Suspense> with SiteNavLinks as fallback. */
export function SiteNav() {
  return <SiteNavLinks pathname={usePathname()} />;
}

export function SiteNavLinks({ pathname }: { pathname: string | null }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-1 gap-y-1 text-sm">
      {ITEMS.map((item) => {
        const active = pathname !== null && (item.href === "/" ? pathname === "/" : pathname.startsWith(item.href));
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`rounded-lg px-2.5 py-1.5 transition ${
                active ? "bg-indigo-50 font-medium text-indigo-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
