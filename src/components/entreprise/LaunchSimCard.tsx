"use client";

import { useState } from "react";
import { acreRate, simulateLaunch, type CompanyStatus } from "@/lib/launch";
import { formatEUR } from "@/lib/budget";

export default function LaunchSimCard() {
  const [status, setStatus] = useState<CompanyStatus>("micro");
  const [grantMonthly, setGrantMonthly] = useState(1000);
  const [grantMonths, setGrantMonths] = useState(6);
  const [acre, setAcre] = useState(true);
  const [contribution, setContribution] = useState(15000);
  const [needLow, setNeedLow] = useState(1500);
  const [needHigh, setNeedHigh] = useState(2500);

  const result = simulateLaunch(
    { status, regionMonthlyGrant: grantMonthly, regionGrantMonths: grantMonths, acre, personalContribution: contribution, monthlyProvision: 0 },
    needLow,
    needHigh
  );

  return (
    <section className="budget-card">
      <h2 className="text-xl font-bold border-b-2 border-slate-100 pb-2 mb-5">
        Simulateur de lancement
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm font-semibold text-slate-500 mb-1">
            Statut envisagé
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
          <p className="text-xs text-slate-500 mt-1">
            Exonération ACRE : −{(acreRate(status) * 100).toFixed(0)} % de cotisations
            la 1ʳᵉ année (maintien du droit à l&apos;exonération debut
            d&apos;activité).
          </p>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-500 mb-1">
            Aide région / mois (€)
          </label>
          <input
            type="number"
            value={grantMonthly || ""}
            onChange={(e) => setGrantMonthly(parseFloat(e.target.value) || 0)}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-500 mb-1">
            Durée de l&apos;aide (mois)
          </label>
          <input
            type="number"
            value={grantMonths || ""}
            onChange={(e) => setGrantMonths(parseInt(e.target.value) || 0)}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div>
          <label className="block text-sm font-semibold text-slate-500 mb-1">
            Apport personnel (€)
          </label>
          <input
            type="number"
            value={contribution || ""}
            onChange={(e) => setContribution(parseFloat(e.target.value) || 0)}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-500 mb-1">
            Besoin mensuel mini (€)
          </label>
          <input
            type="number"
            value={needLow || ""}
            onChange={(e) => setNeedLow(parseFloat(e.target.value) || 0)}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-500 mb-1">
            Besoin mensuel maxi (€)
          </label>
          <input
            type="number"
            value={needHigh || ""}
            onChange={(e) => setNeedHigh(parseFloat(e.target.value) || 0)}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="flex items-center gap-2 mt-6 rounded-md bg-slate-100 px-3 py-2 text-sm">
            <input type="checkbox" checked={acre} onChange={(e) => setAcre(e.target.checked)} />
            Bénéficie de l&apos;ACRE
          </label>
        </div>
      </div>

      <div className="rounded-lg border-l-4 border-emerald-600 bg-emerald-50 p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <div className="text-xs uppercase font-bold text-emerald-900">
            Aides régionales
          </div>
          <div className="text-xl font-bold text-emerald-800">
            {formatEUR(result.totalGrants)}
          </div>
        </div>
        <div>
          <div className="text-xs uppercase font-bold text-emerald-900">
            Exonération ACRE
          </div>
          <div className="text-xl font-bold text-emerald-800">
            {formatEUR(result.totalAcreExemption)}
          </div>
        </div>
        <div>
          <div className="text-xs uppercase font-bold text-emerald-900">
            Trésorerie tenable
          </div>
          <div className="text-xl font-bold text-emerald-800">
            {result.runwayMonths} mois
          </div>
        </div>
        <div>
          <div className="text-xs uppercase font-bold text-emerald-900">
            Apport personnel
          </div>
          <div className="text-xl font-bold text-emerald-800">
            {formatEUR(contribution)}
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-500 mt-3">
        Estimation indicative. Vérifiez les dispositifs exacts de votre région
        (aides à la création, prêts d&apos;honneur, Bourse French Tech…) et les
        conditions ACRE auprès de votre CFE.
      </p>
    </section>
  );
}
