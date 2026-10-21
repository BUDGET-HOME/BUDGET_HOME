"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

const TABS = [
  { href: "/", label: "Budget du Foyer" },
  { href: "/entreprise", label: "Gestion Entreprise" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const fit = pathname.startsWith("/entreprise");

  useEffect(() => {
    if (!fit) return;
    document.documentElement.classList.add("fit-viewport");
    return () => document.documentElement.classList.remove("fit-viewport");
  }, [fit]);

  return (
    <div className={fit ? "flex h-full min-h-0 overflow-hidden" : "flex min-h-screen"}>
      <aside className="no-print w-60 shrink-0 border-r border-slate-200 bg-white">
        <div className="px-4 py-5 border-b border-slate-100">
          <h1 className="text-lg font-bold text-slate-900">BUDGET_HOME</h1>
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
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="flex-1 min-w-0 p-5">{children}</main>
      <style jsx global>{`
        html.fit-viewport,
        html.fit-viewport body {
          height: 100%;
          overflow: hidden;
        }
        html.fit-viewport body > div {
          height: 100%;
          min-height: 0;
          overflow: hidden;
        }
        html.fit-viewport main {
          display: flex;
          flex-direction: column;
          height: 100%;
          min-height: 0;
          overflow: hidden;
          padding: 8px 12px;
        }
        html.fit-viewport .budget-card {
          margin-bottom: 6px;
          padding: 8px 10px;
        }
        html.fit-viewport .budget-card h2 {
          font-size: 0.9rem;
          margin-bottom: 0.25rem;
          padding-bottom: 0.15rem;
        }
        html.fit-viewport .budget-card .mb-5 { margin-bottom: 0.35rem !important; }
        html.fit-viewport .budget-card .mb-4 { margin-bottom: 0.3rem !important; }
        html.fit-viewport .budget-card .mb-3 { margin-bottom: 0.25rem !important; }
        html.fit-viewport .budget-card .mt-5,
        html.fit-viewport .budget-card .mt-4,
        html.fit-viewport .budget-card .my-5 { margin-top: 0.3rem !important; }
        html.fit-viewport .budget-card .my-5 { margin-bottom: 0.3rem !important; }
        html.fit-viewport .budget-card .gap-6,
        html.fit-viewport .budget-card .gap-5,
        html.fit-viewport .budget-card .gap-4 { gap: 0.35rem !important; }
        html.fit-viewport .budget-card .p-4 { padding: 0.4rem !important; }
        html.fit-viewport .budget-card .py-3 { padding-top: 0.2rem !important; padding-bottom: 0.2rem !important; }
        html.fit-viewport .budget-card .overflow-x-auto { max-width: 100%; }
        html.fit-viewport .budget-card table th,
        html.fit-viewport .budget-card table td {
          padding: 1px 4px !important;
          line-height: 1.25;
        }
        html.fit-viewport .charges-fit th,
        html.fit-viewport .charges-fit td {
          white-space: nowrap;
        }
        html.fit-viewport .fit-help { display: none; }
        html.fit-viewport .budget-card .text-2xl { font-size: 1rem !important; }
        html.fit-viewport .budget-card .text-xl { font-size: 0.95rem !important; }
        html.fit-viewport .freelance-board .text-2xl { font-size: 1.5rem !important; line-height: 2rem !important; }
        html.fit-viewport .freelance-board .text-xl { font-size: 1.25rem !important; line-height: 1.75rem !important; }
        html.fit-viewport .budget-card input,
        html.fit-viewport .budget-card select,
        html.fit-viewport .budget-card textarea {
          padding: 0.15rem 0.4rem !important;
        }
        html.fit-viewport .freelance-board input,
        html.fit-viewport .freelance-board select {
          padding: 0.5rem 0.75rem !important;
          font-size: 1rem !important;
        }
        html.fit-viewport .freelance-board input.unit-input {
          padding-right: 4.75rem !important;
        }
        html.fit-viewport .h-96 { height: 8rem !important; }
        html.fit-viewport .h-72 { height: 6.5rem !important; }
        html.fit-viewport .h-56 { height: 5rem !important; }
        @media print {
          html.fit-viewport,
          html.fit-viewport body,
          html.fit-viewport body > div,
          html.fit-viewport main,
          html.fit-viewport .freelance-board {
            height: auto !important;
            overflow: visible !important;
            display: block !important;
          }
          html.fit-viewport .fit-frame-host {
            height: auto !important;
            overflow: visible !important;
            position: static !important;
          }
          html.fit-viewport .fit-frame-inner {
            position: static !important;
            transform: none !important;
            width: auto !important;
          }
        }
      `}</style>
    </div>
  );
}
