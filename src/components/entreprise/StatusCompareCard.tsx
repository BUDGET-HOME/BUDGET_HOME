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
    saveField,
  } = useStatusCompareData();

  // Use saved data or defaults
  const revenue = savedData?.revenue || 60000;
  const expense = savedData?.expense || 500;

  // Local state for inputs (not auto-saved)
  const [localRevenue, setLocalRevenue] = useState<number>(revenue);
  const [localExpense, setLocalExpense] = useState<number>(expense);

  // Sync local state with saved data when it changes
  useEffect(() => {
    if (savedData) {
      setLocalRevenue(savedData.revenue || 60000);
      setLocalExpense(savedData.expense || 500);
    }
  }, [savedData]);

  // Generic save handler
  const handleSave = useCallback(async <K extends keyof Omit<typeof savedData, 'updatedAt' | 'userId'>>(
    field: K,
    value: any
  ) => {
    await saveField(field, value);
  }, [saveField, savedData]);

  // Generic key down handler
  const handleKeyDown = useCallback(<K extends keyof Omit<typeof savedData, 'updatedAt' | 'userId'>>(
    field: K,
    value: any,
    e: React.KeyboardEvent
  ) => {
    if (e.key === "Enter") {
      handleSave(field, value);
    }
  }, [handleSave]);

  // Change handlers for local state
  const handleRevenueChange = useCallback((value: number) => {
    setLocalRevenue(value);
  }, []);

  const handleExpenseChange = useCallback((value: number) => {
    setLocalExpense(value);
  }, []);

  const results = simulateYear({
    status: "micro",
    services: [],
    annualRevenue: localRevenue,
    monthlyBusinessExpense: localExpense,
  });
  const { best } = bestStatus(results);

  if (dataLoading) {
    return (
      <section className="budget-card">
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2" />
            <p className="text-slate-500">Chargement des donn\u00e9es...</p>
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
            Revenu annuel envisag\u00e9 (\u20ac)
          </label>
          <input
            type="number"
            value={localRevenue || ""}
            onChange={(e) => handleRevenueChange(parseFloat(e.target.value) || 0)}
            onBlur={() => handleSave('revenue', localRevenue)}
            onKeyDown={(e) => handleKeyDown('revenue', localRevenue, e)}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
          <input
            type="range"
            min={10000}
            max={300000}
            step={5000}
            value={localRevenue}
            onChange={(e) => handleRevenueChange(parseInt(e.target.value))}
            onBlur={() => handleSave('revenue', localRevenue)}
            onKeyDown={(e) => handleKeyDown('revenue', localRevenue, e)}
            className="w-full mt-2"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-500 mb-1">
            Charges mensuelles (\u20ac)
          </label>
          <input
            type="number"
            value={localExpense || ""}
            onChange={(e) => handleExpenseChange(parseFloat(e.target.value) || 0)}
            onBlur={() => handleSave('expense', localExpense)}
            onKeyDown={(e) => handleKeyDown('expense', localExpense, e)}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </div>
      </div>

      <div className="rounded-lg border-l-4 border-emerald-600 bg-emerald-50 p-4 mb-5">
        <div className="text-sm font-bold text-emerald-900">Recommandation</div>
        <div className="text-xl font-bold text-emerald-800">{best.label}</div>
        <div className="text-sm text-emerald-700">
          Revenu net annuel estim\u00e9 : {formatEUR(best.totalTakeHome)} \u2014 taux
          effectif {(best.effectiveRate * 100).toFixed(1)} %
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm mb-5">
          <thead>
            <tr className="border-b-2 border-slate-200 text-left text-xs uppercase text-slate-500">
              <th className="py-2 px-2">Statut</th>
              <th className="py-2 px-2">Cotisations</th>
              <th className="py-2 px-2">Imp\u00f4ts</th>
              <th className="py-2 px-2">Net annuel</th>
              <th className="py-2 px-2">Taux effectif</th>
              <th className="py-2 px-2">\u00c9ligible</th>
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

      <h3 className="font-bold text-sm mb-2">Plafonds de revenu \u00e0 conna\u00eetre</h3>
      <ul className="text-sm space-y-1">
        {plafonds().map((p) => (
          <li key={p.label} className="flex gap-2">
            <span className="font-semibold min-w-56">{p.label}</span>
            <span>
              {p.limit === Infinity ? "illimit\u00e9" : formatEUR(p.limit)} \u2014{" "}
              <span className="text-slate-500">{p.note}</span>
            </span>
          </li>
        ))}
      </ul>

      <p className="text-xs text-slate-500 mt-4">
        Estimations simplifi\u00e9es (taux 2025, bar\u00e8me indicatif) \u2014 validez avec un
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
