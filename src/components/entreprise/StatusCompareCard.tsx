"use client";

import { useState } from "react";
import { bestStatus, plafonds, simulateYear } from "@/lib/business";
import { formatEUR } from "@/lib/budget";

export default function StatusCompareCard() {
  const [revenue, setRevenue] = useState(60000);
  const [expense, setExpense] = useState(500);

  const results = simulateYear({
    status: "micro",
    services: [],
    annualRevenue: revenue,
    monthlyBusinessExpense: expense,
  });
  const { best } = bestStatus(results);

  return (
    <section className="budget-card">
      <h2 className="text-xl font-bold border-b-2 border-slate-100 pb-2 mb-5">
        Meilleur statut selon le revenu annuel
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <div>
          <label className="block text-sm font-semibold text-slate-500 mb-1">
            Revenu annuel envisagé (€)
          </label>
          <input
            type="number"
            value={revenue || ""}
            onChange={(e) => setRevenue(parseFloat(e.target.value) || 0)}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
          <input
            type="range"
            min={10000}
            max={300000}
            step={5000}
            value={revenue}
            onChange={(e) => setRevenue(parseInt(e.target.value))}
            className="w-full mt-2"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-500 mb-1">
            Charges mensuelles (€)
          </label>
          <input
            type="number"
            value={expense || ""}
            onChange={(e) => setExpense(parseFloat(e.target.value) || 0)}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </div>
      </div>

      <div className="rounded-lg border-l-4 border-emerald-600 bg-emerald-50 p-4 mb-5">
        <div className="text-sm font-bold text-emerald-900">Recommandation</div>
        <div className="text-xl font-bold text-emerald-800">{best.label}</div>
        <div className="text-sm text-emerald-700">
          Revenu net annuel estimé : {formatEUR(best.totalTakeHome)} — taux
          effectif {(best.effectiveRate * 100).toFixed(1)} %
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm mb-5">
          <thead>
            <tr className="border-b-2 border-slate-200 text-left text-xs uppercase text-slate-500">
              <th className="py-2 px-2">Statut</th>
              <th className="py-2 px-2">Cotisations</th>
              <th className="py-2 px-2">Impôts</th>
              <th className="py-2 px-2">Net annuel</th>
              <th className="py-2 px-2">Taux effectif</th>
              <th className="py-2 px-2">Éligible</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr
                key={r.status}
                className={`border-b border-slate-100 ${
                  r.status === best.status ? "bg-emerald-50 font-semibold" : ""
                }`}
              >
                <td className="py-2 px-2">{r.label}</td>
                <td className="py-2 px-2">{formatEUR(r.socialContributions)}</td>
                <td className="py-2 px-2">{formatEUR(r.tax)}</td>
                <td className="py-2 px-2">{formatEUR(r.totalTakeHome)}</td>
                <td className="py-2 px-2">{(r.effectiveRate * 100).toFixed(1)} %</td>
                <td className="py-2 px-2">
                  {r.eligible ? (
                    <span className="text-green-600">Oui</span>
                  ) : (
                    <span className="text-red-500" title={r.eligibilityNote}>
                      Non
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="font-bold text-sm mb-2">Plafonds de revenu à connaître</h3>
      <ul className="text-sm space-y-1">
        {plafonds().map((p) => (
          <li key={p.label} className="flex gap-2">
            <span className="font-semibold min-w-56">{p.label}</span>
            <span>
              {p.limit === Infinity ? "illimité" : formatEUR(p.limit)} —{" "}
              <span className="text-slate-500">{p.note}</span>
            </span>
          </li>
        ))}
      </ul>

      <p className="text-xs text-slate-500 mt-4">
        Estimations simplifiées (taux 2025, barème indicatif) — validez avec un
        expert-comptable avant de choisir votre statut.
      </p>
    </section>
  );
}
