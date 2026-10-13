"use client";

import { useState } from "react";
import { useBudget } from "@/hooks/useBudget";
import Header from "./Header";
import RevenusCard from "./RevenusCard";
import DepensesForm from "./DepensesForm";
import AnalyseCard from "./AnalyseCard";
import LoanCard from "./LoanCard";
import ChargesTable from "./ChargesTable";
import { normalizeState } from "@/lib/budget-service";

export default function BudgetApp() {
  const { state, update, replaceState, user, authReady, loaded, syncStatus } = useBudget();
  const [viewMode, setViewMode] = useState<"monthly" | "annual">("monthly");
  const [error, setError] = useState<string | null>(null);

  const handleImport = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = normalizeState(JSON.parse(text));
      replaceState(parsed);
      setError(null);
    } catch {
      setError("Fichier invalide : format JSON attendu.");
    }
  };

  if (!authReady || !loaded) {
    return (
      <main className="mx-auto max-w-4xl p-5">
        <p className="text-slate-500">Chargement…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl p-5">
      <Header user={user} syncStatus={syncStatus} state={state} onImport={handleImport} />
      {error && (
        <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      {!user && (
        <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-800 no-print">
          Vous utilisez l&apos;application en mode local.{" "}
          <a href="/signup" className="font-semibold underline">
            Créez un compte
          </a>{" "}
          pour sauvegarder vos données sur le serveur.
        </div>
      )}
      <RevenusCard state={state} update={update} />
      <DepensesForm state={state} update={update} />
      <AnalyseCard state={state} viewMode={viewMode} setViewMode={setViewMode} />
      <LoanCard state={state} update={update} />
      <ChargesTable state={state} update={update} />
    </main>
  );
}
