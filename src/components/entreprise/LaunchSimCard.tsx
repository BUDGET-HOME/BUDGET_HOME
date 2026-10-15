"use client";

import { useState, useEffect, useCallback } from "react";
import { acreRate, simulateLaunch, type CompanyStatus } from "@/lib/launch";
import { formatEUR } from "@/lib/budget";
import { useLaunchData } from "@/hooks/useLaunchData";

export default function LaunchSimCard() {
  const {
    data: savedData,
    loading: dataLoading,
    error: dataError,
    saving,
    updateField,
  } = useLaunchData();

  // Use saved data or defaults
  const status = savedData?.status || "micro";
  const grantMonthly = savedData?.grantMonthly || 1000;
  const grantMonths = savedData?.grantMonths || 6;
  const acre = savedData?.acre ?? true;
  const contribution = savedData?.contribution || 15000;
  const needLow = savedData?.needLow || 1500;
  const needHigh = savedData?.needHigh || 2500;

  // Handlers with auto-save
  const handleStatusChange = useCallback((value: CompanyStatus) => {
    updateField('status', value);
  }, [updateField]);

  const handleGrantMonthlyChange = useCallback((value: number) => {
    updateField('grantMonthly', value);
  }, [updateField]);

  const handleGrantMonthsChange = useCallback((value: number) => {
    updateField('grantMonths', value);
  }, [updateField]);

  const handleAcreChange = useCallback((value: boolean) => {
    updateField('acre', value);
  }, [updateField]);

  const handleContributionChange = useCallback((value: number) => {
    updateField('contribution', value);
  }, [updateField]);

  const handleNeedLowChange = useCallback((value: number) => {
    updateField('needLow', value);
  }, [updateField]);

  const handleNeedHighChange = useCallback((value: number) => {
    updateField('needHigh', value);
  }, [updateField]);

  const result = simulateLaunch(
    { 
      status, 
      regionMonthlyGrant: grantMonthly, 
      regionGrantMonths: grantMonths, 
      acre, 
      personalContribution: contribution, 
      monthlyProvision: 0 
    },
    needLow,
    needHigh
  );

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
        Simulateur de lancement
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm font-semibold text-slate-500 mb-1">
            Statut envisagé
          </label>
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value as CompanyStatus)}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          >
            <option value="micro">Micro-entreprise</option>
            <option value="ei">EI (réel)</option>
            <option value="eurl">EURL</option>
            <option value="sasu">SASU</option>
          </select>
          <p className="text-xs text-slate-500 mt-1">
            Exonération ACRE : −{(acreRate(status) * 100).toFixed(0)} % de cotisations
            la 1ʳᵉ année (maintien du droit à l'exonération debut
            d'activité).
          </p>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-500 mb-1">
            Aide région / mois (€)
          </label>
          <input
            type="number"
            value={grantMonthly || ""}
            onChange={(e) => handleGrantMonthlyChange(parseFloat(e.target.value) || 0)}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-500 mb-1">
            Durée de l'aide (mois)
          </label>
          <input
            type="number"
            value={grantMonths || ""}
            onChange={(e) => handleGrantMonthsChange(parseInt(e.target.value) || 0)}
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
            onChange={(e) => handleContributionChange(parseFloat(e.target.value) || 0)}
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
            onChange={(e) => handleNeedLowChange(parseFloat(e.target.value) || 0)}
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
            onChange={(e) => handleNeedHighChange(parseFloat(e.target.value) || 0)}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="flex items-center gap-2 mt-6 rounded-md bg-slate-100 px-3 py-2 text-sm">
            <input 
              type="checkbox" 
              checked={acre} 
              onChange={(e) => handleAcreChange(e.target.checked)} 
            />
            Bénéficie de l'ACRE
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
        (aides à la création, prêts d'honneur, Bourse French Tech…) et les
        conditions ACRE auprès de votre CFE.
      </p>

      {saving && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
          Sauvegarde en cours...
        </div>
      )}
    </section>
  );
}
