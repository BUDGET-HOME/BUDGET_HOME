"use client";

import { useState } from "react";
import {
  annuityPayment,
  computeLoanSummary,
  insuranceForMonth,
  projectLoan,
} from "@/lib/loan";
import { formatEUR } from "@/lib/budget";
import type { BudgetState } from "@/lib/types";

interface Props {
  state: BudgetState;
  update: (fn: (prev: BudgetState) => BudgetState) => void;
}

export default function LoanCard({ state, update }: Props) {
  const [extraMonthly, setExtraMonthly] = useState(0);
  const [extraOneTime, setExtraOneTime] = useState(0);
  const [extraOneTimeDate, setExtraOneTimeDate] = useState("");
  const [showAmort, setShowAmort] = useState(false);
  const loan = state.loan;
  const summary = computeLoanSummary(loan);

  const setLoan = (patch: Partial<typeof loan>) =>
    update((p) => ({ ...p, loan: { ...p.loan, ...patch } }));

  const projection = projectLoan(loan, summary.remainingBalance, summary.remainingMonths, {
    oneTime: extraOneTime,
    oneTimeDate: extraOneTimeDate,
    monthly: extraMonthly,
  });
  const hasExtra = extraOneTime > 0 || extraMonthly > 0;
  const savedMonths = summary.remainingMonths - projection.monthsToPayoff;

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
            onChange={(e) => setLoan({ capital: parseFloat(e.target.value) || 0 })}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-500 mb-1">
            Taux débiteur fixe (%)
          </label>
          <input
            type="number"
            step="0.01"
            value={loan.rate || ""}
            onChange={(e) => setLoan({ rate: parseFloat(e.target.value) || 0 })}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-500 mb-1">
            Durée (mois)
          </label>
          <input
            type="number"
            value={loan.durationMonths || ""}
            onChange={(e) =>
              setLoan({ durationMonths: parseInt(e.target.value) || 0 })
            }
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-semibold text-slate-500 mb-1">
            Versement mensuel (€) — assurance incluse
          </label>
          <input
            type="number"
            value={loan.monthlyPayment || ""}
            placeholder={`Auto : ${(annuityPayment(
              loan.capital,
              loan.rate,
              loan.durationMonths
            ) + insuranceForMonth(loan, loan.capital)).toFixed(2)}`}
            onChange={(e) =>
              setLoan({ monthlyPayment: parseFloat(e.target.value) || 0 })
            }
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
          <p className="text-xs text-slate-500 mt-1">
            Montant total du versement (comme sur le tableau d&apos;amortissement).
            Laissez vide pour un calcul automatique hors assurance.
          </p>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-500 mb-1">
            TAEG de l&apos;offre (%)
          </label>
          <input
            type="number"
            step="0.001"
            value={loan.offeredTaeg || ""}
            placeholder="4.200"
            onChange={(e) =>
              setLoan({ offeredTaeg: parseFloat(e.target.value) || 0 })
            }
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
          <p className="text-xs text-slate-500 mt-1">
            Indiqué sur l&apos;offre de prêt, pour comparaison avec le TAEG recalculé.
          </p>
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
        <div>
          <label className="block text-sm font-semibold text-slate-500 mb-1">
            Mode d&apos;assurance
          </label>
          <select
            value={loan.insuranceMode}
            onChange={(e) =>
              setLoan({
                insuranceMode: e.target.value as "remaining" | "capital",
              })
            }
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          >
            <option value="remaining">Sur capital restant dû (dégressive)</option>
            <option value="capital">Prime fixe (moyenne mensuelle)</option>
          </select>
        </div>
      </div>

      {loan.insuranceMode === "remaining" ? (
        <div className="mb-4">
          <label className="block text-sm font-semibold text-slate-500 mb-1">
            Taux annuel d&apos;assurance (%)
          </label>
          <input
            type="number"
            step="0.01"
            value={loan.insuranceRate || ""}
            placeholder="1.10"
            onChange={(e) =>
              setLoan({ insuranceRate: parseFloat(e.target.value) || 0 })
            }
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
          <p className="text-xs text-slate-500 mt-1">
            1ʳᵉ cotisation :{" "}
            {insuranceForMonth(loan, loan.capital).toFixed(2)} € — cotisation
            dégressive calculée sur le capital restant dû chaque mois.
          </p>
        </div>
      ) : (
        <div className="mb-4">
          <label className="block text-sm font-semibold text-slate-500 mb-1">
            Cotisation moyenne par mois (€)
          </label>
          <input
            type="number"
            step="0.01"
            value={loan.insuranceAvgMonthly || ""}
            onChange={(e) =>
              setLoan({ insuranceAvgMonthly: parseFloat(e.target.value) || 0 })
            }
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </div>
      )}

      <details className="mb-4 rounded-md border border-slate-200 bg-slate-50">
        <summary className="cursor-pointer px-4 py-2 font-semibold text-slate-600 text-sm">
          💰 Frais à l&apos;entrée (dus une seule fois)
        </summary>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-4 py-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Frais de prise de garantie (€)
            </label>
            <input
              type="number"
              value={loan.guaranteeFees || ""}
              onChange={(e) =>
                setLoan({ guaranteeFees: parseFloat(e.target.value) || 0 })
              }
              className="w-full rounded-md border border-slate-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Frais d&apos;intermédiaires (€)
            </label>
            <input
              type="number"
              value={loan.brokerFees || ""}
              onChange={(e) =>
                setLoan({ brokerFees: parseFloat(e.target.value) || 0 })
              }
              className="w-full rounded-md border border-slate-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Frais de dossier (€)
            </label>
            <input
              type="number"
              value={loan.fileFees || ""}
              onChange={(e) =>
                setLoan({ fileFees: parseFloat(e.target.value) || 0 })
              }
              className="w-full rounded-md border border-slate-300 px-3 py-2"
            />
          </div>
        </div>
      </details>

      <div className="rounded-lg border-l-4 border-purple-600 bg-purple-50 p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-xs uppercase font-bold text-purple-900">
              Mensualité 1ʳᵉ période
            </div>
            <div className="text-xl font-bold text-purple-800">
              {formatEUR(summary.firstMonth.payment + summary.firstMonth.insurance)}
            </div>
            <div className="text-xs text-slate-500">
              dont assurance {summary.firstMonth.insurance.toFixed(2)} €
            </div>
          </div>
          <div>
            <div className="text-xs uppercase font-bold text-purple-900">
              Restant dû
            </div>
            <div className="text-xl font-bold text-purple-800">
              {formatEUR(summary.remainingBalance)}
            </div>
            <div className="text-xs text-slate-500">
              {summary.remainingMonths} mois restants
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
              intérêts {formatEUR(summary.totalInterest)} + assurance{" "}
              {formatEUR(summary.totalInsurance)} + frais{" "}
              {formatEUR(summary.totalFees)}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase font-bold text-purple-900">
              TAEG calculé
            </div>
            <div className="text-xl font-bold text-purple-800">
              {summary.taeg !== null ? `${summary.taeg.toFixed(3)} %` : "—"}
            </div>
            {loan.offeredTaeg > 0 && summary.taeg !== null && (
              <div className="text-xs text-slate-500">
                offre : {loan.offeredTaeg.toFixed(3)} %{" "}
                {Math.abs(summary.taeg - loan.offeredTaeg) < 0.15 ? (
                  <span className="text-green-600 font-semibold">✓ cohérent</span>
                ) : (
                  <span className="text-amber-600 font-semibold">
                    — écart : l&apos;offre n&apos;inclut que la part obligatoire de
                    l&apos;assurance dans le TAEG
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>Avancement ({summary.elapsedMonths} mensualités payées)</span>
            <span>{summary.progressPercent.toFixed(1)} %</span>
          </div>
          <div className="h-3 bg-purple-100 rounded-full overflow-hidden">
            <div
              className="h-3 bg-purple-600 rounded-full transition-all"
              style={{ width: `${summary.progressPercent}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Déjà payé : {formatEUR(summary.totalPaid)} — reste à payer :{" "}
            {formatEUR(summary.totalRemaining)} — fin : {summary.endDate}
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-lg border border-indigo-200 bg-indigo-50 p-4">
        <h3 className="font-bold text-indigo-800 text-sm mb-2">
          ⏩ Remboursement anticipé
        </h3>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Somme ponctuelle (€)
            </label>
            <input
              type="number"
              value={extraOneTime || ""}
              placeholder="0"
              onChange={(e) => setExtraOneTime(parseFloat(e.target.value) || 0)}
              className="rounded-md border border-slate-300 px-3 py-2 w-40"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Date du paiement ponctuel
            </label>
            <input
              type="month"
              value={extraOneTimeDate}
              onChange={(e) => setExtraOneTimeDate(e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 w-40"
            />
            <p className="text-xs text-slate-500 mt-1">
              Vide = ce mois-ci.
            </p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Mensualité supplémentaire (€/mois)
            </label>
            <input
              type="number"
              value={extraMonthly || ""}
              placeholder="0"
              onChange={(e) => setExtraMonthly(parseFloat(e.target.value) || 0)}
              className="rounded-md border border-slate-300 px-3 py-2 w-40"
            />
          </div>
          <div className="text-sm min-w-56">
            {hasExtra && projection.payoffDate ? (
              <>
                <p>
                  Solder en{" "}
                  <strong>
                    {projection.payoffDate.toLocaleDateString("fr-FR", {
                      month: "long",
                      year: "numeric",
                    })}
                  </strong>{" "}
                  — <strong className="text-green-700">{savedMonths} mois gagnés</strong>
                  {projection.interestSaved > 0 && (
                    <>
                      {" "}— intérêts économisés{" "}
                      <strong className="text-green-700">
                        {formatEUR(projection.interestSaved)}
                      </strong>
                    </>
                  )}
                </p>
                {extraOneTime > 0 && (
                  <p className="text-slate-600 text-xs mt-1">
                    Restant dû après le paiement ponctuel :{" "}
                    {formatEUR(Math.max(0, summary.remainingBalance - extraOneTime))}
                  </p>
                )}
              </>
            ) : (
              <p className="text-slate-500">
                Saisissez une somme ponctuelle et/ou une mensualité
                supplémentaire pour simuler un remboursement anticipé.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="text-center mt-4">
        <button
          onClick={() => setShowAmort((v) => !v)}
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
        >
          📅 Voir la projection annuelle
        </button>
      </div>

      {showAmort && (
        <div className="mt-5 border-t-2 border-slate-200 pt-5">
          <h3 className="font-bold mb-3">Projection annuelle</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-200">
                  <th className="p-2 text-right">Année</th>
                  <th className="p-2 text-right">Restant dû</th>
                  <th className="p-2 text-right">Intérêts</th>
                  <th className="p-2 text-right">Principal</th>
                  <th className="p-2 text-right">Assurance</th>
                  <th className="p-2 text-right">Total annuel</th>
                </tr>
              </thead>
              <tbody>
                {projection.rows.map((r) => (
                  <tr key={r.year} className="border-b border-slate-200">
                    <td className="p-2 text-right">Année {r.year}</td>
                    <td className="p-2 text-right">{formatEUR(r.balance)}</td>
                    <td className="p-2 text-right text-red-600">
                      {formatEUR(r.interest)}
                    </td>
                    <td className="p-2 text-right text-green-600">
                      {formatEUR(r.principal)}
                    </td>
                    <td className="p-2 text-right">{formatEUR(r.insurance)}</td>
                    <td className="p-2 text-right font-bold">
                      {formatEUR(r.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
