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
    saveField,
  } = useLaunchData();

  // Use saved data or defaults
  const status = savedData?.status || "micro";
  const grantMonthly = savedData?.grantMonthly || 1000;
  const grantMonths = savedData?.grantMonths || 6;
  const acre = savedData?.acre ?? true;
  const contribution = savedData?.contribution || 15000;
  const needLow = savedData?.needLow || 1500;
  const needHigh = savedData?.needHigh || 2500;

  // Local state for inputs (not auto-saved)
  const [localStatus, setLocalStatus] = useState<CompanyStatus>(status);
  const [localGrantMonthly, setLocalGrantMonthly] = useState<number>(grantMonthly);
  const [localGrantMonths, setLocalGrantMonths] = useState<number>(grantMonths);
  const [localAcre, setLocalAcre] = useState<boolean>(acre);
  const [localContribution, setLocalContribution] = useState<number>(contribution);
  const [localNeedLow, setLocalNeedLow] = useState<number>(needLow);
  const [localNeedHigh, setLocalNeedHigh] = useState<number>(needHigh);

  // Sync local state with saved data when it changes
  useEffect(() => {
    if (savedData) {
      setLocalStatus(savedData.status || "micro");
      setLocalGrantMonthly(savedData.grantMonthly || 1000);
      setLocalGrantMonths(savedData.grantMonths || 6);
      setLocalAcre(savedData.acre ?? true);
      setLocalContribution(savedData.contribution || 15000);
      setLocalNeedLow(savedData.needLow || 1500);
      setLocalNeedHigh(savedData.needHigh || 2500);
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
  const handleStatusChange = useCallback((value: CompanyStatus) => {
    setLocalStatus(value);
  }, []);

  const handleGrantMonthlyChange = useCallback((value: number) => {
    setLocalGrantMonthly(value);
  }, []);

  const handleGrantMonthsChange = useCallback((value: number) => {
    setLocalGrantMonths(value);
  }, []);

  const handleAcreChange = useCallback((value: boolean) => {
    setLocalAcre(value);
  }, []);

  const handleContributionChange = useCallback((value: number) => {
    setLocalContribution(value);
  }, []);

  const handleNeedLowChange = useCallback((value: number) => {
    setLocalNeedLow(value);
  }, []);

  const handleNeedHighChange = useCallback((value: number) => {
    setLocalNeedHigh(value);
  }, []);

  const result = simulateLaunch(
    { 
      status: localStatus, 
      regionMonthlyGrant: localGrantMonthly, 
      regionGrantMonths: localGrantMonths, 
      acre: localAcre, 
      personalContribution: localContribution, 
      monthlyProvision: 0 
    },
    localNeedLow,
    localNeedHigh
  );

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
        Simulateur de lancement
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm font-semibold text-slate-500 mb-1">
            Statut envisag\u00e9
          </label>
          <select
            value={localStatus}
            onChange={(e) => handleStatusChange(e.target.value as CompanyStatus)}
            onBlur={() => handleSave('status', localStatus)}
            onKeyDown={(e) => handleKeyDown('status', localStatus, e)}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          >
            <option value="micro">Micro-entreprise</option>
            <option value="ei">EI (r\u00e9el)</option>
            <option value="eurl">EURL</option>
            <option value="sasu">SASU</option>
          </select>
          <p className="text-xs text-slate-500 mt-1">
            Exon\u00e9ration ACRE : \u2212{(acreRate(localStatus) * 100).toFixed(0)} % de cotisations
            la 1\u02b3\u1d49 ann\u00e9e (maintien du droit \u00e0 l'exon\u00e9ration debut
            d'activit\u00e9).
          </p>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-500 mb-1">
            Aide r\u00e9gion / mois (\u20ac)
          </label>
          <input
            type="number"
            value={localGrantMonthly || ""}
            onChange={(e) => handleGrantMonthlyChange(parseFloat(e.target.value) || 0)}
            onBlur={() => handleSave('grantMonthly', localGrantMonthly)}
            onKeyDown={(e) => handleKeyDown('grantMonthly', localGrantMonthly, e)}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-500 mb-1">
            Dur\u00e9e de l'aide (mois)
          </label>
          <input
            type="number"
            value={localGrantMonths || ""}
            onChange={(e) => handleGrantMonthsChange(parseInt(e.target.value) || 0)}
            onBlur={() => handleSave('grantMonths', localGrantMonths)}
            onKeyDown={(e) => handleKeyDown('grantMonths', localGrantMonths, e)}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div>
          <label className="block text-sm font-semibold text-slate-500 mb-1">
            Apport personnel (\u20ac)
          </label>
          <input
            type="number"
            value={localContribution || ""}
            onChange={(e) => handleContributionChange(parseFloat(e.target.value) || 0)}
            onBlur={() => handleSave('contribution', localContribution)}
            onKeyDown={(e) => handleKeyDown('contribution', localContribution, e)}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-500 mb-1">
            Besoin mensuel mini (\u20ac)
          </label>
          <input
            type="number"
            value={localNeedLow || ""}
            onChange={(e) => handleNeedLowChange(parseFloat(e.target.value) || 0)}
            onBlur={() => handleSave('needLow', localNeedLow)}
            onKeyDown={(e) => handleKeyDown('needLow', localNeedLow, e)}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-500 mb-1">
            Besoin mensuel maxi (\u20ac)
          </label>
          <input
            type="number"
            value={localNeedHigh || ""}
            onChange={(e) => handleNeedHighChange(parseFloat(e.target.value) || 0)}
            onBlur={() => handleSave('needHigh', localNeedHigh)}
            onKeyDown={(e) => handleKeyDown('needHigh', localNeedHigh, e)}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="flex items-center gap-2 mt-6 rounded-md bg-slate-100 px-3 py-2 text-sm">
            <input 
              type="checkbox" 
              checked={localAcre} 
              onChange={(e) => handleAcreChange(e.target.checked)}
              onBlur={() => handleSave('acre', localAcre)}
              onKeyDown={(e) => handleKeyDown('acre', localAcre, e)}
            />
            B\u00e9n\u00e9ficie de l'ACRE
          </label>
        </div>
      </div>

      <div className="rounded-lg border-l-4 border-emerald-600 bg-emerald-50 p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <div className="text-xs uppercase font-bold text-emerald-900">
            Aides r\u00e9gionales
          </div>
          <div className="text-xl font-bold text-emerald-800">
            {formatEUR(result.totalGrants)}
          </div>
        </div>
        <div>
          <div className="text-xs uppercase font-bold text-emerald-900">
            Exon\u00e9ration ACRE
          </div>
          <div className="text-xl font-bold text-emerald-800">
            {formatEUR(result.totalAcreExemption)}
          </div>
        </div>
        <div>
          <div className="text-xs uppercase font-bold text-emerald-900">
            Tr\u00e9sorerie tenable
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
            {formatEUR(localContribution)}
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-500 mt-3">
        Estimation indicative. V\u00e9rifiez les dispositifs exacts de votre r\u00e9gion
        (aides \u00e0 la cr\u00e9ation, pr\u00eats d'honneur, Bourse French Tech\u2026) et les
        conditions ACRE aupr\u00e8s de votre CFE.
      </p>

      {saving && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
          Sauvegarde en cours...
        </div>
      )}
    </section>
  );
}
