"use client";

import { useState } from "react";
import { computeLoanSummary, projectLoan } from "@/lib/loan";
import { formatEUR } from "@/lib/budget";
import type { BudgetState } from "@/lib/types";

interface Props {
  state: BudgetState;
  update: (fn: (prev: BudgetState) => BudgetState) => void;
}

export default function LoanCard({ state, update }: Props) {
  const [extra, setExtra] = useState(0);
  const loan = state.loan;
  const summary = computeLoanSummary(loan);

  const setLoan = (patch: Partial<typeof loan>) =>
    update((p) => ({ ...p, loan: { ...p.loan, ...patch } }));

  const projection = projectLoan(
    loan,
    summary.remainingBalance,
    summary.remainingMonths,
    extra
  );

  const baseMonths = summary.remainingMonths;
  const savedMonths = baseMonths - projection.monthsToPayoff;

  return (
    <section className="budget-card budget-card-immo">
      <h2 className="text-xl font-bold text-purple-700 border-b-2 border-purple-100 pb-2 mb-5">
        🏦 Notre crédit maison
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm font-semibold text-slate-500 mb-1">
            Capital emprunté (€)
          </label>
          <input
            type="number"
            value={loan.capital || ""}
            placeholder="200000"
            onChange={(e) => setLoan({ capital: parseFloat(e.target.value) || 0 })}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-500 mb-1">
            Taux d&apos;intérêt (%)
          </label>
          <input
            type="number"
            step="0.01"
            value={loan.rate || ""}
            placeholder="3.5"
            onChange={(e) => setLoan({ rate: parseFloat(e.target.value) || 0 })}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-500 mb-1">
            Taux assurance (%)
          </label>
          <input
            type="number"
            step="0.01"
            value={loan.insuranceRate || ""}
            placeholder="0.34"
            onChange={(e) => setLoan({ insuranceRate: parseFloat(e.target.value) || 0 })}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-500 mb-1">
            Durée (mois)
          </label>
          <input
            type="number"
            value={loan.durationMonths || ""}
            placeholder="240"
            onChange={(e) => setLoan({ durationMonths: parseInt(e.target.value) || 0 })}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-s-500 mb-1 text-slate-500">
            Mensualité constatée (€)
          </label>
          <input
            type="number"
            value={loan.monthlyPayment || ""}
            placeholder="Auto si vide"
            onChange={(e) => setLoan({ monthlyPayment: parseFloat(e.target.value) || 0 })}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-500 mb-1">
            1ʳᵉ échéance
          </label>
          <input
            type="month"
            value={loan.startDate}
            onChange={(e) => setLoan({ startDate: e.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </div>
      </div>

      <div className="mt-5 rounded-lg border-l-4 border-purple-600 bg-purple-50 p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-xs uppercase font-bold text-purple-900">Restant dû</div>
            <div className="text-xl font-bold text-purple-800">
              {formatEUR(summary.remainingBalance)}
            </div>
            <div className="text-xs text-slate-500">
              sur {formatEUR(loan.capital)}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase font-bold text-purple-900">
              Mensualité
            </div>
            <div className="text-xl font-bold text-purple-800">
              {formatEUR(
                (loan.monthlyPayment > 0
                  ? loan.monthlyPayment
                  : summary.monthlyPrincipal + summary.monthlyInterest) +
                  summary.monthlyInsurance
              )}
            </div>
            <div className="text-xs text-slate-500">
              dont assurance {formatEUR(summary.monthlyInsurance)}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase font-bold text-purple-900">
              Coût total du crédit
            </div>
            <div className="text-xl font-bold text-red-600">
              {formatEUR(summary.totalCost)}
            </div>
            <div className="text-xs text-slate-500">
              intérêts + assurance
            </div>
          </div>
          <div>
            <div className="text-xs uppercase font-bold text-purple-900">
              Il reste à payer
            </div>
            <div className="text-xl font-bold text-purple-800">
              {formatEUR(summary.totalRemainingCost)}
            </div>
            <div className="text-xs text-slate-500">
              {summary.remainingMonths} mois — fin {summary.endDate}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>Avancement du remboursement</span>
            <span>{summary.progressPercent.toFixed(1)} %</span>
          </div>
          <div className="h-3 bg-purple-100 rounded-full overflow-hidden">
            <div
              className="h-3 bg-purple-600 rounded-full transition-all"
              style={{ width: `${summary.progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-lg border border-indigo-200 bg-indigo-50 p-4">
        <h3 className="font-bold text-indigo-800 text-sm mb-2">
          ⏩ Simulation de remboursement anticipé
        </h3>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Mensualité supplémentaire (€/mois)
            </label>
            <input
              type="number"
              value={extra || ""}
              placeholder="0"
              onChange={(e) => setExtra(parseFloat(e.target.value) || 0)}
              className="rounded-md border border-slate-300 px-3 py-2 w-40"
            />
          </div>
          <div className="text-sm">
            {extra > 0 && projection.payoffDate ? (
              <>
                <p>
                  Crédit soldé en{" "}
                  <strong>{projection.payoffDate.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</strong>{" "}
                  soit{" "}
                  <strong className="text-green-700">
                    {savedMonths} mois plus tôt
                  </strong>
                  .
                </p>
              </>
            ) : (
              <p className="text-slate-500">
                Ajoutez un montant mensuel pour voir l&apos;impact sur la durée et les intérêts.
              </p>
            )}
          </div>
        </div>
        {extra > 0 && projection.payoffDate && savedMonths > 0 && (
          <p className="mt-2 text-xs text-slate-500">
            Nouvelle mensualité totale :{" "}
            {formatEUR(
              (loan.monthlyPayment > 0
                ? loan.monthlyPayment
                : summary.monthlyPrincipal + summary.monthlyInterest) + extra
            )}
            , payée pendant {projection.monthsToPayoff} mois.
          </p>
        )}
      </div>

      <details className="mt-4 rounded-md border border-slate-200 bg-slate-50">
        <summary className="cursor-pointer px-4 py-2 font-semibold text-slate-600 text-sm">
          🔍 Détail du calcul
        </summary>
        <div className="calc-content px-4 py-3">
          <p>Intérêts/mois : {summary.monthlyInterest.toFixed(2)} €</p>
          <p>Principal/mois : {summary.monthlyPrincipal.toFixed(2)} €</p>
          <p>Assurance/mois : {summary.monthlyInsurance.toFixed(2)} €</p>
          <p>Déjà remboursé : {formatEUR(summary.totalPaid)}</p>
        </div>
      </details>
    </section>
  );
}
