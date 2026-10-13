"use client";

import { useState } from "react";
import { calculateImmo, generateAmortization, monthsToSave } from "@/lib/immo";
import { computeBalance, formatEUR } from "@/lib/budget";
import type { BudgetState } from "@/lib/types";

interface Props {
  state: BudgetState;
  update: (fn: (prev: BudgetState) => BudgetState) => void;
}

export default function ImmoCard({ state, update }: Props) {
  const [showAmort, setShowAmort] = useState(false);
  const s1 = parseFloat(state.salary1) || 0;
  const s2 = parseFloat(state.salary2) || 0;
  const immo = state.immo;

  const result = calculateImmo({
    salary1: s1,
    salary2: s2,
    expenses: state.expenses,
    force5050: state.force5050,
    apport: immo.immoApport,
    ratePercent: immo.immoRate,
    insurancePercent: immo.immoInsurance,
    durationYears: immo.immoDuration,
    type: immo.immoType,
  });

  const savings = computeBalance(s1, s2, state.expenses, "monthly", state.force5050)
    .savingsCapacity;
  const monthsSave = monthsToSave(immo.immoApport, savings);
  const amortization = generateAmortization(
    result.loanAmount,
    (immo.immoRate / 100) / 12,
    immo.immoDuration * 12,
    result.monthlyInsuranceCost
  );

  const setImmo = (patch: Partial<typeof immo>) =>
    update((p) => ({ ...p, immo: { ...p.immo, ...patch } }));

  return (
    <section className="budget-card budget-card-immo">
      <h2 className="text-xl font-bold text-purple-700 border-b-2 border-purple-100 pb-2 mb-2">
        4. Simulateur Achat Immobilier 🏡
      </h2>
      <p className="text-sm text-slate-500 mb-5">
        Calcul basé sur votre &quot;Reste à vivre&quot; réel ou les 35% de la banque.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-500 mb-1">Apport (€)</label>
          <input
            type="number"
            value={immo.immoApport}
            onChange={(e) => setImmo({ immoApport: parseFloat(e.target.value) || 0 })}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
          {monthsSave !== null && (
            <span className="inline-block mt-1 rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 text-xs font-semibold">
              ⏳ Épargne : {Math.floor(monthsSave / 12)} an(s) {Math.ceil(monthsSave % 12)} mois
            </span>
          )}
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-500 mb-1">Intérêt (%)</label>
          <input
            type="number"
            step="0.05"
            value={immo.immoRate}
            onChange={(e) => setImmo({ immoRate: parseFloat(e.target.value) || 0 })}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-500 mb-1">Assurance (%)</label>
          <input
            type="number"
            step="0.01"
            value={immo.immoInsurance}
            onChange={(e) => setImmo({ immoInsurance: parseFloat(e.target.value) || 0 })}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-500 mb-1">Durée (Ans)</label>
          <select
            value={immo.immoDuration}
            onChange={(e) => setImmo({ immoDuration: parseInt(e.target.value) })}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          >
            <option value={15}>15 ans</option>
            <option value={20}>20 ans</option>
            <option value={25}>25 ans</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div>
          <label className="block text-sm font-semibold text-slate-500 mb-1">Type de bien</label>
          <select
            value={immo.immoType}
            onChange={(e) => setImmo({ immoType: e.target.value as "ancien" | "neuf" })}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          >
            <option value="ancien">🏚️ Ancien (Notaire ~8%)</option>
            <option value="neuf">🏗️ Neuf (Notaire ~2.5%)</option>
          </select>
        </div>
        <div className="rounded-md border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm">
          <span className="font-semibold text-slate-500">Loyer actuel :</span>{" "}
          <strong className="text-indigo-700">
            {formatEUR(result.currentAnnualRent / 12)}
          </strong>{" "}
          €/mois
        </div>
      </div>

      <div className="mt-5 rounded-lg border-l-4 border-purple-600 bg-purple-50 p-4">
        <h3 className="font-bold text-purple-700">Enveloppe Globale (Maison + Frais)</h3>
        <div className="text-3xl font-extrabold text-purple-700 my-2">
          {formatEUR(result.totalProject)}
        </div>
        <div className="rounded-lg border-2 border-dashed border-purple-400 bg-white p-3 text-center">
          <div className="text-xs uppercase font-bold text-slate-500">
            Prix Net Vendeur (Prix Maison Affiché)
          </div>
          <div className="text-2xl font-bold text-purple-800">
            {formatEUR(result.netSellerPrice)}
          </div>
          <small className="text-slate-500">
            Dont frais de notaire (~{(result.notaryRate * 100).toFixed(1)}%) :{" "}
            {formatEUR(result.notaryFees)}
          </small>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <div className="text-sm text-purple-900">Mensualité Max</div>
            <strong className="text-lg">{result.safeMonthlyPayment.toFixed(0)} €/mois</strong>
            <div className="text-xs text-slate-500">
              Dont assurance : {result.monthlyInsuranceCost.toFixed(0)} €
            </div>
          </div>
          <div>
            <div className="text-sm text-purple-900">Coût total du crédit</div>
            <strong className="text-lg text-red-600">{formatEUR(result.totalCreditCost)}</strong>
            <div className="text-xs text-slate-500">(Intérêts + Assurance)</div>
          </div>
        </div>
        <p
          className={`mt-2 text-sm italic ${
            result.limitedByRestToLive ? "text-amber-600" : "text-green-600"
          }`}
        >
          {result.limitedByRestToLive
            ? "⚠️ Limite : votre Reste à Vivre limite votre capacité d'emprunt par rapport au taux de 35%."
            : "✅ Feu vert : vous pouvez emprunter au maximum des 35% d'endettement."}
        </p>
      </div>

      <div className="text-center mt-4 no-print">
        <button
          onClick={() => setShowAmort((v) => !v)}
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
        >
          📅 Voir le tableau d&apos;amortissement
        </button>
      </div>

      {showAmort && (
        <div className="mt-5 border-t-2 border-slate-200 pt-5">
          <h3 className="font-bold mb-3">Tableau d&apos;amortissement (Estimation)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-200">
                  <th className="p-2 text-right">Année</th>
                  <th className="p-2 text-right">Restant Dû</th>
                  <th className="p-2 text-right">Intérêts</th>
                  <th className="p-2 text-right">Principal</th>
                  <th className="p-2 text-right">Assurance</th>
                  <th className="p-2 text-right">Total Annuel</th>
                </tr>
              </thead>
              <tbody>
                {amortization.map((r) => (
                  <tr key={r.year} className="border-b border-slate-200">
                    <td className="p-2 text-right">Année {r.year}</td>
                    <td className="p-2 text-right">{formatEUR(r.balance)}</td>
                    <td className="p-2 text-right text-red-600">{formatEUR(r.interest)}</td>
                    <td className="p-2 text-right text-green-600">{formatEUR(r.principal)}</td>
                    <td className="p-2 text-right">{formatEUR(r.insurance)}</td>
                    <td className="p-2 text-right font-bold">{formatEUR(r.total)}</td>
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
