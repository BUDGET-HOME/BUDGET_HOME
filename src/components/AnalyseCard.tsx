"use client";

import { computeBalance, computeVerdict, formatEUR, loanPeriodAmount } from "@/lib/budget";
import type { ViewMode } from "@/lib/budget";
import { LOAN_CATEGORY, type BudgetState } from "@/lib/types";

interface Props {
  state: BudgetState;
  viewMode: ViewMode;
  setViewMode: (m: ViewMode) => void;
}

export default function AnalyseCard({ state, viewMode, setViewMode }: Props) {
  const s1 = parseFloat(state.salary1) || 0;
  const s2 = parseFloat(state.salary2) || 0;
  const balance = computeBalance(
    s1,
    s2,
    state.expenses,
    viewMode,
    state.force5050,
    state.mode,
    state.loan
  );
  const verdict = computeVerdict(balance.balance1, balance.displayTotal * (viewMode === "monthly" ? 12 : 1), state.name1, state.name2);

  const total = balance.displayTotal;
  const paid1 = balance.displayPaid1;
  const paid2 = balance.displayPaid2;
  const maxPaid = Math.max(paid1, paid2, 1);
  const categoryTotals = state.expenses.reduce<Record<string, number>>((acc, e) => {
    const v = e.freq === "monthly" ? e.amount * 12 : e.amount;
    acc[e.category] = (acc[e.category] ?? 0) + v / (viewMode === "monthly" ? 12 : 1);
    return acc;
  }, {});
  const loanAmount = loanPeriodAmount(state.loan, viewMode);
  if (loanAmount > 0) categoryTotals[LOAN_CATEGORY] = loanAmount;
  const categories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <section className="budget-card">
      <div className="flex flex-wrap justify-between items-center border-b-2 border-slate-100 pb-2 mb-5 gap-3">
        <h2 className="text-xl font-bold">Équilibre du budget actuel</h2>
        <div className="flex rounded-lg bg-slate-100 p-1">
          <button
            onClick={() => setViewMode("annual")}
            className={`px-4 py-1.5 text-sm font-semibold rounded-md ${
              viewMode === "annual" ? "bg-white shadow text-blue-600" : "text-slate-500"
            }`}
          >
            Vue Annuelle
          </button>
          <button
            onClick={() => setViewMode("monthly")}
            className={`px-4 py-1.5 text-sm font-semibold rounded-md ${
              viewMode === "monthly" ? "bg-white shadow text-blue-600" : "text-slate-500"
            }`}
          >
            Vue Mensuelle
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs uppercase font-bold text-slate-500">
            Total Dépenses ({viewMode === "monthly" ? "Mois" : "An"})
          </div>
          <div className="text-2xl font-bold mt-1">{formatEUR(total)}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs uppercase font-bold text-slate-500">
            Capacité d&apos;Épargne ({viewMode === "monthly" ? "Mois" : "An"})
          </div>
          <div className="text-2xl font-bold mt-1 text-green-600">
            {formatEUR(balance.savingsCapacity)}
          </div>
        </div>
      </div>

      <div className={state.mode === "commun" ? "hidden" : "grid grid-cols-1 md:grid-cols-2 gap-5 my-5"}>
        <div className="border border-slate-200 rounded-lg p-4">
          <h3 className="text-sm font-bold mb-3 text-center text-slate-600">Répartition</h3>
          <div className="flex h-6 rounded overflow-hidden mb-2">
            <div
              className="bg-blue-600 flex items-center justify-center text-xs text-white font-bold"
              style={{ width: `${(paid1 / maxPaid) * 100}%` }}
            >
              {paid1 > 0 && formatEUR(paid1)}
            </div>
            <div
              className="bg-pink-600 flex items-center justify-center text-xs text-white font-bold"
              style={{ width: `${(paid2 / maxPaid) * 100}%` }}
            >
              {paid2 > 0 && formatEUR(paid2)}
            </div>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-blue-600 font-semibold">{state.name1}</span>
            <span className="text-pink-600 font-semibold">{state.name2}</span>
          </div>
        </div>
        <div className="border border-slate-200 rounded-lg p-4 md:col-span-2">
          <h3 className="text-sm font-bold mb-3 text-slate-600">Top Catégories (dont crédit maison)</h3>
          {categories.length === 0 && <p className="text-sm text-slate-400">Aucune dépense.</p>}
          {categories.map(([cat, v]) => (
            <div key={cat} className="mb-2">
              <div className="flex justify-between text-xs mb-1">
                <span>{cat}</span>
                <span className="font-semibold">{formatEUR(v)}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded">
                <div
                  className="h-2 bg-emerald-500 rounded"
                  style={{ width: `${(v / categories[0][1]) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={state.mode === "commun" ? "hidden" : "border-l-4 border-blue-600 bg-blue-50 rounded-r-lg p-4"}>
        <h3 className="font-bold text-sm">⚖️ Charges à équilibrer</h3>
        {verdict.status === "empty" && <p className="font-bold mt-1">Aucune donnée.</p>}
        {verdict.status === "balanced" && <p className="font-bold mt-1">✅ Équilibré</p>}
        {verdict.status === "debt" && (
          <p className="font-bold mt-1">
            {verdict.debtor} &gt; {verdict.creditor} : {verdict.amount.toFixed(2)} €
            <span className="text-sm text-slate-500 font-normal">
              {" "}
              ({viewMode === "monthly" ? "par mois" : "sur l'année"})
            </span>
          </p>
        )}
      </div>

      <details className={state.mode === "commun" ? "hidden" : "mt-4 rounded-md border border-slate-200 bg-slate-50"}>
        <summary className="cursor-pointer px-4 py-2 font-semibold text-slate-600 text-sm">
          🔍 Détail du calcul de l&apos;équilibre
        </summary>
        <div className="calc-content px-4 py-3">
          <p>Total dépenses : {balance.displayTotal.toFixed(2)} €</p>
          <p>
            Payé par {state.name1} : {balance.displayPaid1.toFixed(2)} € — Part théorique :{" "}
            {balance.shouldPay1.toFixed(2)} €
          </p>
          <p>
            Solde {state.name1} = {balance.balance1 > 0 ? "+" : ""}
            {balance.balance1.toFixed(2)} €
          </p>
        </div>
      </details>
    </section>
  );
}
