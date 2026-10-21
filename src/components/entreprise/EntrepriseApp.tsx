"use client";

import { useCallback, useEffect, useState } from "react";
import { downloadJSON } from "@/lib/budget-service";
import { parseEntrepriseBackup, writeStoredCashFlow } from "@/lib/entreprise-backup";
import { stateFromBackup, toEntrepriseBackup } from "@/lib/entreprise-state";
import { EntrepriseProvider, useEntrepriseContext } from "@/hooks/useEntreprise";
import PageHeader from "../PageHeader";
import GanttCard from "./GanttCard";
import StatusCompareCard from "./StatusCompareCard";
import FreelanceSimulatorCard from "./FreelanceSimulatorCard";
import CashFlowPlannerCard from "./CashFlowPlannerCard";

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
  const fit = activeTool === "freelance";

  useEffect(() => {
    if (!fit) return;
    document.documentElement.classList.add("fit-viewport");
    return () => document.documentElement.classList.remove("fit-viewport");
  }, [fit]);

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
      <div className="mx-auto max-w-5xl">
        <p className="text-slate-500">Chargement...</p>
      </div>
    );
  }

  return (
    <div className={fit ? "flex h-full min-h-0 flex-1 flex-col gap-1.5" : "mx-auto max-w-5xl"}>
      <PageHeader
        title="Gestion Entreprise"
        user={user}
        syncStatus={syncStatus}
        onExport={handleExport}
        onImport={handleImport}
        compact={fit}
      />
      {error && (
        <div className={`rounded-md border border-red-300 bg-red-50 text-red-700 ${fit ? "shrink-0 px-2 py-1 text-xs" : "mb-4 px-4 py-2 text-sm"}`}>
          {error}
        </div>
      )}
      {syncStatus === "error" && (
        <div className={`rounded-md border border-red-300 bg-red-50 text-red-700 ${fit ? "shrink-0 px-2 py-1 text-xs" : "mb-4 px-4 py-2 text-sm"}`}>
          La sauvegarde sur le compte a échoué. Les modifications restent sur cet appareil.
        </div>
      )}
      {notice && (
        <div className={`rounded-md border border-green-300 bg-green-50 text-green-800 ${fit ? "shrink-0 px-2 py-1 text-xs" : "mb-4 px-4 py-2 text-sm"}`}>
          {notice}
        </div>
      )}
      {!user && (
        <div className={`rounded-md border border-blue-200 bg-blue-50 text-blue-800 no-print ${fit ? "shrink-0 px-2 py-1 text-xs" : "mb-4 px-4 py-2 text-sm"}`}>
          Mode local.{" "}
          <a href="/signup" className="font-semibold underline">
            Créez un compte
          </a>{" "}
          pour sauvegarder sur le serveur.
        </div>
      )}

      <div className={`no-print flex flex-wrap ${fit ? "shrink-0 gap-1" : "mb-5 gap-2"}`}>
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            onClick={() => setActiveTool(tool.id)}
            className={`rounded-lg font-semibold transition-colors ${fit ? "px-2.5 py-1 text-xs" : "px-4 py-2 text-sm"} ${
              activeTool === tool.id
                ? "bg-blue-600 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {tool.label}
          </button>
        ))}
      </div>

      {activeTool === "freelance" && (
        <div className="min-h-0 flex-1">
          <FreelanceSimulatorCard key={`freelance-${revision}`} />
        </div>
      )}
      {activeTool === "statuts" && <StatusCompareCard key={`statuts-${revision}`} />}
      {activeTool === "gantt" && <GanttCard key={`gantt-${revision}`} />}
      {activeTool === "cashflow" && <CashFlowPlannerCard key={`cashflow-${revision}`} />}
      <style jsx global>{`
        html.fit-viewport,
        html.fit-viewport body {
          height: 100%;
          overflow: hidden;
        }
        html.fit-viewport body > div {
          height: 100%;
          min-height: 0;
          overflow: hidden;
        }
        html.fit-viewport main {
          display: flex;
          flex-direction: column;
          height: 100%;
          min-height: 0;
          overflow: hidden;
          padding: 8px 12px;
        }
      `}</style>
    </div>
  );
}
