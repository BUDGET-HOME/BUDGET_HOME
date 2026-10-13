"use client";

import type { BudgetState } from "@/lib/types";

interface Props {
  state: BudgetState;
  update: (fn: (prev: BudgetState) => BudgetState) => void;
}

export default function ChargesTable({ state, update }: Props) {
  const sorted = [...state.expenses].sort((a, b) => a.category.localeCompare(b.category));

  const reset = () => {
    if (confirm("Tout effacer ?")) {
      update((p) => ({ ...p, expenses: [] }));
    }
  };

  return (
    <section className="budget-card">
      <div className="flex justify-between items-center border-b-2 border-slate-100 pb-2 mb-5">
        <h2 className="text-xl font-bold">Détail des charges</h2>
        <button
          onClick={reset}
          className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 no-print"
        >
          🗑️ Reset
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-slate-200 text-left text-xs uppercase text-slate-500">
              <th className="py-3 px-3">Cat</th>
              <th className="py-3 px-3">Quoi</th>
              <th className="py-3 px-3">Prix</th>
              <th className="py-3 px-3">Freq</th>
              <th className="py-3 px-3">Qui</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-slate-400">
                  Aucune dépense enregistrée.
                </td>
              </tr>
            )}
            {sorted.map((exp) => (
              <tr key={exp.id} className="border-b border-slate-100">
                <td className="py-3 px-3">{exp.category.split(" ")[0]}</td>
                <td className="py-3 px-3 font-semibold">{exp.desc}</td>
                <td className="py-3 px-3">{exp.amount} €</td>
                <td className="py-3 px-3">{exp.freq === "monthly" ? "Mois" : "An"}</td>
                <td className="py-3 px-3">
                  {state.mode === "commun" ? (
                    <span className="rounded-md bg-purple-600 px-2 py-0.5 text-xs font-semibold text-white">
                      Commun
                    </span>
                  ) : (
                    <span
                      className={`rounded-md px-2 py-0.5 text-xs font-semibold text-white ${
                        exp.payer === "1" ? "bg-blue-600" : "bg-pink-600"
                      }`}
                    >
                      {(exp.payer === "1" ? state.name1 : state.name2).substring(0, 3)}
                    </span>
                  )}
                </td>
                <td className="py-3 px-3 text-right no-print">
                  <button
                    onClick={() =>
                      update((p) => ({
                        ...p,
                        expenses: p.expenses.filter((e) => e.id !== exp.id),
                      }))
                    }
                    className="rounded bg-red-100 text-red-500 px-2 py-1 hover:bg-red-200"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
