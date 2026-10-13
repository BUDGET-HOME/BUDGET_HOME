"use client";

import { computeRatio } from "@/lib/budget";
import type { BudgetState } from "@/lib/types";

interface Props {
  state: BudgetState;
  update: (fn: (prev: BudgetState) => BudgetState) => void;
}

export default function RevenusCard({ state, update }: Props) {
  const s1 = parseFloat(state.salary1) || 0;
  const s2 = parseFloat(state.salary2) || 0;
  const ratio = computeRatio(s1, s2, state.force5050);

  return (
    <section className="budget-card">
      <h2 className="text-xl font-bold border-b-2 border-slate-100 pb-2 mb-5">
        1. Revenus & Profils
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <input
            type="text"
            value={state.name1}
            onChange={(e) => update((p) => ({ ...p, name1: e.target.value }))}
            className="w-full border-b-2 border-transparent font-bold text-blue-600 mb-1 focus:outline-none focus:border-blue-400"
          />
          <label className="block text-sm font-semibold text-slate-500 mb-1">
            Salaire Net Mensuel (€)
          </label>
          <input
            type="number"
            value={state.salary1}
            placeholder="2000"
            onChange={(e) => update((p) => ({ ...p, salary1: e.target.value }))}
            className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <input
            type="text"
            value={state.name2}
            onChange={(e) => update((p) => ({ ...p, name2: e.target.value }))}
            className="w-full border-b-2 border-transparent font-bold text-pink-600 mb-1 focus:outline-none focus:border-pink-400"
          />
          <label className="block text-sm font-semibold text-slate-500 mb-1">
            Salaire Net Mensuel (€)
          </label>
          <input
            type="number"
            value={state.salary2}
            placeholder="1800"
            onChange={(e) => update((p) => ({ ...p, salary2: e.target.value }))}
            className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-pink-500 focus:outline-none"
          />
        </div>
      </div>
      <label className="flex items-center gap-2 mt-4 rounded-md bg-slate-100 px-3 py-2 text-sm">
        <input
          type="checkbox"
          checked={state.force5050}
          onChange={(e) => update((p) => ({ ...p, force5050: e.target.checked }))}
        />
        Forcer le 50/50 pour les dépenses courantes
      </label>
      <p className="mt-2 text-sm text-slate-500">
        Ratio appliqué :{" "}
        <span className="font-bold text-slate-900">
          {(ratio.ratio1 * 100).toFixed(0)}% - {(ratio.ratio2 * 100).toFixed(0)}%
          {ratio.forced && " (Forcé)"}
        </span>
      </p>
      <details className="mt-4 rounded-md border border-slate-200 bg-slate-50">
        <summary className="cursor-pointer px-4 py-2 font-semibold text-slate-600 text-sm">
          🔍 Détail du calcul du Ratio
        </summary>
        <div className="calc-content px-4 py-3">
          {ratio.forced ? (
            <p>Mode 50/50 forcé activé. Part de chacun = 50%</p>
          ) : (
            <>
              <p>Total des revenus = {s1} € + {s2} € = {s1 + s2} €</p>
              <p>Part de {state.name1} = {s1} / {s1 + s2} = {(ratio.ratio1 * 100).toFixed(2)} %</p>
              <p>Part de {state.name2} = {s2} / {s1 + s2} = {(ratio.ratio2 * 100).toFixed(2)} %</p>
            </>
          )}
        </div>
      </details>
    </section>
  );
}
