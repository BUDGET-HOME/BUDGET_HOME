"use client";

import { useState } from "react";
import { simulateYear, type ServiceLine } from "@/lib/business";
import { formatEUR } from "@/lib/budget";
import type { CompanyStatus } from "@/lib/launch";

export default function RevenueSimCard() {
  const [status, setStatus] = useState<CompanyStatus>("micro");
  const [services, setServices] = useState<ServiceLine[]>([
    { id: 1, name: "Prestation A", unitPrice: 500, unitsPerMonth: 4 },
  ]);
  const [expense, setExpense] = useState(300);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [units, setUnits] = useState("");

  const addService = () => {
    const p = parseFloat(price);
    const u = parseFloat(units);
    if (!name.trim() || isNaN(p) || p <= 0 || isNaN(u) || u <= 0) return;
    setServices((s) => [...s, { id: Date.now(), name: name.trim(), unitPrice: p, unitsPerMonth: u }]);
    setName("");
    setPrice("");
    setUnits("");
  };

  const removeService = (id: number) =>
    setServices((s) => s.filter((svc) => svc.id !== id));

  const annualRevenue = services.reduce(
    (a, s) => a + s.unitPrice * s.unitsPerMonth * 12,
    0
  );

  const results = simulateYear({
    status,
    services,
    annualRevenue,
    monthlyBusinessExpense: expense,
  });
  const current = results.find((r) => r.status === status)!;

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

      {services.length > 0 && (
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
            {services.map((s) => (
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
            value={status}
            onChange={(e) => setStatus(e.target.value as CompanyStatus)}
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
            value={expense || ""}
            onChange={(e) => setExpense(parseFloat(e.target.value) || 0)}
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
          ⚠ {current.eligibilityNote}
        </p>
      )}
    </section>
  );
}
