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
    return <p className="text-slate-500">Chargement…</p>;
  }

  return (
    <div>
      <PageHeader
        title="Budget du foyer"
        user={user}
        syncStatus={syncStatus}
        onExport={() => exportJSON(state)}
        onImport={handleImport}
      />
      {error && (
        <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      {notice && (
        <div className="mb-4 rounded-md border border-green-300 bg-green-50 px-4 py-2 text-sm text-green-800">
          {notice}
        </div>
      )}
      {!user && (
        <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-800 no-print">
          Mode local.{" "}
          <a href="/signup" className="font-semibold underline">
            Créez un compte
          </a>{" "}
          pour sauvegarder sur le serveur.
        </div>
      )}
      <RevenusCard state={state} update={update} />
      <LoanCard state={state} update={update} />
      <DepensesForm state={state} update={update} />
      <ChartsCard state={state} />
      <AnalyseCard state={state} viewMode={viewMode} setViewMode={setViewMode} />
      <ChargesTable state={state} update={update} />
    </div>
  );
}
