"use client";

import { useState, useEffect, useCallback } from "react";
import { bestStatus, plafonds, simulateYear } from "@/lib/business";
import { formatEUR } from "@/lib/budget";
import { useStatusCompareData } from "@/hooks/useStatusCompareData";

export default function StatusCompareCard() {
  const {
    data: savedData,
    loading: dataLoading,
    error: dataError,
    saving,
    updateField,
  } = useStatusCompareData();

  // Use saved data or defaults
  const revenue = savedData?.revenue || 60000;
  const expense = savedData?.expense || 500;

  // Handlers with auto-save
  const handleRevenueChange = useCallback((value: number) => {
    updateField('revenue', value);
  }, [updateField]);

  const handleExpenseChange = useCallback((value: number) => {
    updateField('expense', value);
  }, [updateField]);

  const results = simulateYear({
    status: "micro",
    services: [],
    annualRevenue: revenue,
    monthlyBusinessExpense: expense,
  });
  const { best } = bestStatus(results);

  if (dataLoading) {
    return (
      <section className="budget-card">
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2" />
            <p className="text-slate-500">Chargement des données...</p>
          </div>
        </div>
      </section>
    );
  }

  if (dataError) {
    return (
      <section className="budget-card">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {dataError}
        </div>
      </section>
    );
  }

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
            onChange={(e) => handleRevenueChange(parseFloat(e.target.value) || 0)}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
          <input
            type="range"
            min={10000}
            max={300000}
            step={5000}
            value={revenue}
            onChange={(e) => handleRevenueChange(parseInt(e.target.value))}
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
            onChange={(e) => handleExpenseChange(parseFloat(e.target.value) || 0)}
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

      {saving && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
          Sauvegarde en cours...
        </div>
      )}
    </section>
  );
}
