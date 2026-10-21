"use client";

import { useState } from "react";
import { useBudget } from "@/hooks/useBudget";
import PageHeader from "./PageHeader";
import RevenusCard from "./RevenusCard";
import DepensesForm from "./DepensesForm";
import AnalyseCard from "./AnalyseCard";
import LoanCard from "./LoanCard";
import ChargesTable from "./ChargesTable";
import ChartsCard from "./ChartsCard";
import { exportJSON, normalizeState } from "@/lib/budget-service";
import { isEntrepriseBackup } from "@/lib/entreprise-backup";
import FitFrame from "./FitFrame";

export default function BudgetApp() {
  const { state, update, replaceState, user, authReady, loaded, syncStatus } = useBudget();
  const [viewMode, setViewMode] = useState<"monthly" | "annual">("monthly");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const handleImport = async (file: File) => {
    try {
      const raw = JSON.parse(await file.text()) as unknown;
      if (isEntrepriseBackup(raw)) {
        setNotice(null);
        setError("Ce fichier vient de Gestion Entreprise. Importez-le depuis cette page.");
        return;
      }
      replaceState(normalizeState(raw));
      setError(null);
      setNotice("Budget importé.");
    } catch {
      setNotice(null);
      setError("Fichier invalide : format JSON attendu.");
    }
  };

  if (!authReady || !loaded) {
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col">
        <p className="text-slate-500">Chargement…</p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col gap-1.5">
      <PageHeader
        title="Budget du foyer"
        user={user}
        syncStatus={syncStatus}
        onExport={() => exportJSON(state)}
        onImport={handleImport}
        compact
      />
      {error && (
        <div className="shrink-0 rounded-md border border-red-300 bg-red-50 px-2 py-1 text-xs text-red-700">
          {error}
        </div>
      )}
      {notice && (
        <div className="shrink-0 rounded-md border border-green-300 bg-green-50 px-2 py-1 text-xs text-green-800">
          {notice}
        </div>
      )}
      {!user && (
        <div className="shrink-0 rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs text-blue-800 no-print">
          Mode local.{" "}
          <a href="/signup" className="font-semibold underline">
            Créez un compte
          </a>{" "}
          pour sauvegarder sur le serveur.
        </div>
      )}
      <FitFrame>
        <div className="grid grid-cols-2 items-start gap-2">
          <div className="min-w-0">
            <RevenusCard state={state} update={update} />
            <AnalyseCard state={state} viewMode={viewMode} setViewMode={setViewMode} />
          </div>
          <div className="min-w-0">
            <DepensesForm state={state} update={update} />
            <ChargesTable state={state} update={update} />
          </div>
          <div className="col-span-2 grid grid-cols-2 items-start gap-2">
            <div className="min-w-0">
              <LoanCard state={state} update={update} />
            </div>
            <div className="min-w-0">
              <ChartsCard state={state} />
            </div>
          </div>
        </div>
      </FitFrame>
    </div>
  );
}
