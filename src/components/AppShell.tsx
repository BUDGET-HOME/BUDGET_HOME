"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

const TABS = [
  { href: "/", label: "Budget du Foyer", icon: "🏠" },
  { href: "/entreprise", label: "Gestion Entreprise", icon: "💼" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen">
      <aside className="no-print w-60 shrink-0 border-r border-slate-200 bg-white">
        <div className="px-4 py-5 border-b border-slate-100">
          <h1 className="text-lg font-bold text-slate-900">💰 BUDGET_HOME</h1>
        </div>
        <nav className="p-3 space-y-1">
          {TABS.map((tab) => {
            const active =
              tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                  active
                    ? "bg-blue-600 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span className="text-base">{tab.icon}</span>
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="flex-1 min-w-0 p-5">{children}</main>
    </div>
  );
}
