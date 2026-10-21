"use client";

import { useCallback, useState } from "react";
import { downloadJSON } from "@/lib/budget-service";
import { parseEntrepriseBackup, writeStoredCashFlow } from "@/lib/entreprise-backup";
import { stateFromBackup, toEntrepriseBackup } from "@/lib/entreprise-state";
import { EntrepriseProvider, useEntrepriseContext } from "@/hooks/useEntreprise";
import PageHeader from "../PageHeader";
import GanttCard from "./GanttCard";
import StatusCompareCard from "./StatusCompareCard";
import FreelanceSimulatorCard from "./FreelanceSimulatorCard";
import CashFlowPlannerCard from "./CashFlowPlannerCard";
import FitFrame from "../FitFrame";

const TOOLS = [
  { id: "freelance", label: "Simulateur Freelance" },
  { id: "statuts", label: "Choix du statut" },
  { id: "gantt", label: "Planning de lancement" },
  { id: "cashflow", label: "Trésorerie" },
] as const;

type ToolId = (typeof TOOLS)[number]["id"];

export default function EntrepriseApp() {
  return (
    <EntrepriseProvider>
      <EntrepriseScreen />
    </EntrepriseProvider>
  );
}

function EntrepriseScreen() {
  const { state, user, loaded, syncStatus, replaceState } = useEntrepriseContext();
  const [activeTool, setActiveTool] = useState<ToolId>("freelance");
  const [revision, setRevision] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const handleExport = useCallback(() => {
    const backup = toEntrepriseBackup(state);
    downloadJSON(`gestion_entreprise_${backup.exportedAt.slice(0, 10)}.json`, backup);
    setError(null);
    setNotice("Export téléchargé.");
  }, [state]);

  const handleImport = useCallback(
    async (file: File) => {
      try {
        const raw = JSON.parse(await file.text()) as unknown;
        const parsed = parseEntrepriseBackup(raw);
        if ("error" in parsed) {
          setNotice(null);
          setError(
            parsed.error === "Ce fichier n'est pas une sauvegarde Entreprise."
              ? "Ce fichier n'est pas une sauvegarde Entreprise. Pour un budget du foyer, ouvrez Budget du foyer."
              : parsed.error
          );
          return;
        }
        if (parsed.backup.cashFlow) writeStoredCashFlow(parsed.backup.cashFlow);
        replaceState(stateFromBackup(parsed.backup));
        setRevision((current) => current + 1);
        setError(null);
        setNotice("Données entreprise importées.");
      } catch {
        setNotice(null);
        setError("Fichier invalide : format JSON attendu.");
      }
    },
    [replaceState]
  );

  if (!loaded) {
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col">
        <p className="text-slate-500">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col gap-1.5">
      <PageHeader
        title="Gestion Entreprise"
        user={user}
        syncStatus={syncStatus}
        onExport={handleExport}
        onImport={handleImport}
        compact
      />
      {error && (
        <div className="shrink-0 rounded-md border border-red-300 bg-red-50 px-2 py-1 text-xs text-red-700">
          {error}
        </div>
      )}
      {syncStatus === "error" && (
        <div className="shrink-0 rounded-md border border-red-300 bg-red-50 px-2 py-1 text-xs text-red-700">
          La sauvegarde sur le compte a échoué. Les modifications restent sur cet appareil.
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

      <div className="no-print flex shrink-0 flex-wrap gap-1">
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            onClick={() => setActiveTool(tool.id)}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
              activeTool === tool.id
                ? "bg-blue-600 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {tool.label}
          </button>
        ))}
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        {activeTool === "freelance" && <FreelanceSimulatorCard key={`freelance-${revision}`} />}
        {activeTool === "statuts" && (
          <FitFrame>
            <StatusCompareCard key={`statuts-${revision}`} />
          </FitFrame>
        )}
        {activeTool === "gantt" && (
          <FitFrame>
            <GanttCard key={`gantt-${revision}`} />
          </FitFrame>
        )}
        {activeTool === "cashflow" && (
          <FitFrame>
            <CashFlowPlannerCard key={`cashflow-${revision}`} />
          </FitFrame>
        )}
      </div>
    </div>
  );
}
