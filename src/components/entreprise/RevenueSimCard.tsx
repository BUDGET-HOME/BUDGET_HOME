"use client";

import { useState, useEffect, useCallback } from "react";
import { simulateYear, type ServiceLine } from "@/lib/business";
import { formatEUR } from "@/lib/budget";
import type { CompanyStatus } from "@/lib/launch";
import { useRevenueData, type RevenueSimulatorData } from "@/hooks/useRevenueData";

export default function RevenueSimCard() {
  const {
    data: savedData,
    loading: dataLoading,
    error: dataError,
    saving,
    saveField,
    saveData,
  } = useRevenueData();

  // Use saved data or defaults
  const status = savedData?.status || "micro";
  const services = savedData?.services || [{ id: 1, name: "Prestation A", unitPrice: 500, unitsPerMonth: 4 }];
  const expense = savedData?.expense || 300;

  // Local state for inputs (not auto-saved)
  const [localStatus, setLocalStatus] = useState<CompanyStatus>(status);
  const [localServices, setLocalServices] = useState<ServiceLine[]>(services);
  const [localExpense, setLocalExpense] = useState<number>(expense);

  // Sync local state with saved data when it changes
  useEffect(() => {
    if (savedData) {
      setLocalStatus(savedData.status || "micro");
      setLocalServices(savedData.services || [{ id: 1, name: "Prestation A", unitPrice: 500, unitsPerMonth: 4 }]);
      setLocalExpense(savedData.expense || 300);
    }
  }, [savedData]);

  // Generic save handler
  const handleSave = useCallback(async <K extends keyof Omit<RevenueSimulatorData, 'updatedAt' | 'userId'>>(
    field: K,
    value: RevenueSimulatorData[K]
  ) => {
    await saveField(field, value);
  }, [saveField]);

  // Generic key down handler
  const handleKeyDown = useCallback(<K extends keyof Omit<RevenueSimulatorData, 'updatedAt' | 'userId'>>(
    field: K,
    value: RevenueSimulatorData[K],
    e: React.KeyboardEvent
  ) => {
    if (e.key === "Enter") {
      handleSave(field, value);
    }
  }, [handleSave]);

  // Change handlers for local state
  const handleStatusChange = useCallback((value: CompanyStatus) => {
    setLocalStatus(value);
  }, []);

  const handleExpenseChange = useCallback((value: number) => {
    setLocalExpense(value);
  }, []);

  const handleServicesChange = useCallback((newServices: ServiceLine[]) => {
    setLocalServices(newServices);
  }, []);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [units, setUnits] = useState("");

  const addService = useCallback(() => {
    const p = parseFloat(price);
    const u = parseFloat(units);
    if (!name.trim() || isNaN(p) || p <= 0 || isNaN(u) || u <= 0) return;
    const newService: ServiceLine = { id: Date.now(), name: name.trim(), unitPrice: p, unitsPerMonth: u };
    const newServices = [...localServices, newService];
    handleServicesChange(newServices);
    setName("");
    setPrice("");
    setUnits("");
    saveData({ services: newServices });
  }, [name, price, units, localServices, handleServicesChange, saveData]);

  const removeService = useCallback((id: number) => {
    const newServices = localServices.filter((svc) => svc.id !== id);
    handleServicesChange(newServices);
    saveData({ services: newServices });
  }, [localServices, handleServicesChange, saveData]);

  const annualRevenue = localServices.reduce(
    (a, s) => a + s.unitPrice * s.unitsPerMonth * 12,
    0
  );

  const results = simulateYear({
    status: localStatus,
    services: localServices,
    annualRevenue,
    monthlyBusinessExpense: localExpense,
  });
  const current = results.find((r) => r.status === localStatus)!;

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
        Simulateur de revenus mensuels
      </h2>

      <div className="flex flex-wrap items-end gap-3 mb-5 no-print">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Prestation</label>
          <input
            type="text"
            value={name}
            placeholder="Ex: Mission conseil"
            onChange={(e) => setName(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Prix unitaire (€)</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 w-32"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Ventes / mois</label>
          <input
            type="number"
            value={units}
            onChange={(e) => setUnits(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 w-24"
          />
        </div>
        <button
          onClick={addService}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          + Ajouter
        </button>
      </div>

      {localServices.length > 0 && (
        <table className="w-full text-sm mb-5">
          <thead>
            <tr className="border-b-2 border-slate-200 text-left text-xs uppercase text-slate-500">
              <th className="py-2 px-2">Prestation</th>
              <th className="py-2 px-2">Prix</th>
              <th className="py-2 px-2">Ventes/mois</th>
              <th className="py-2 px-2">CA mensuel</th>
              <th className="py-2 px-2" />
            </tr>
          </thead>
          <tbody>
            {localServices.map((s) => (
              <tr key={s.id} className="border-b border-slate-100">
                <td className="py-2 px-2 font-semibold">{s.name}</td>
                <td className="py-2 px-2">{formatEUR(s.unitPrice)}</td>
                <td className="py-2 px-2">{s.unitsPerMonth}</td>
                <td className="py-2 px-2">{formatEUR(s.unitPrice * s.unitsPerMonth)}</td>
                <td className="py-2 px-2 text-right no-print">
                  <button
                    onClick={() => removeService(s.id)}
                    className="rounded bg-red-100 text-red-500 px-2 py-1 hover:bg-red-200"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm font-semibold text-slate-500 mb-1">
            Statut fiscal / social
          </label>
          <select
            value={localStatus}
            onChange={(e) => handleStatusChange(e.target.value as CompanyStatus)}
            onBlur={() => handleSave('status', localStatus)}
            onKeyDown={(e) => handleKeyDown('status', localStatus, e)}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          >
            <option value="micro">Micro-entreprise</option>
            <option value="ei">EI (réel)</option>
            <option value="eurl">EURL</option>
            <option value="sasu">SASU</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-500 mb-1">
            Charges mensuelles (€)
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

      <div className="rounded-lg border-l-4 border-blue-600 bg-blue-50 p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <div className="text-xs uppercase font-bold text-blue-900">CA mensuel</div>
          <div className="text-xl font-bold text-blue-800">
            {formatEUR(annualRevenue / 12)}
          </div>
        </div>
        <div>
          <div className="text-xs uppercase font-bold text-blue-900">CA annuel</div>
          <div className="text-xl font-bold text-blue-800">{formatEUR(annualRevenue)}</div>
        </div>
        <div>
          <div className="text-xs uppercase font-bold text-blue-900">
            Revenu net mensuel ({current.label})
          </div>
          <div className="text-xl font-bold text-blue-800">
            {formatEUR(current.totalTakeHome / 12)}
          </div>
        </div>
        <div>
          <div className="text-xs uppercase font-bold text-blue-900">Taux effectif</div>
          <div className="text-xl font-bold text-blue-800">
            {(current.effectiveRate * 100).toFixed(1)} %
          </div>
        </div>
      </div>

      {!current.eligible && (
        <p className="mt-3 text-sm text-amber-700 font-semibold">
          ⚠️ {current.eligibilityNote}
        </p>
      )}

      {saving && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
          Sauvegarde en cours...
        </div>
      )}
    </section>
  );
}
