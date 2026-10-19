"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { downloadJSON, type SyncStatus } from "@/lib/budget-service";
import {
  exportEntrepriseBackup,
  importEntrepriseBackup,
  isEntrepriseBackup,
} from "@/lib/entreprise-backup";
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
  const [activeTool, setActiveTool] = useState<ToolId>("freelance");
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const syncStatus: SyncStatus = "idle";
  const [loaded, setLoaded] = useState(() => !isSupabaseConfigured());
  const [revision, setRevision] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const fetchUser = async () => {
      try {
        const supabase = createClient();
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser || null);
      } finally {
        setLoaded(true);
      }
    };
    void fetchUser();
  }, []);

  const handleExport = useCallback(async () => {
    const { backup, warnings } = await exportEntrepriseBackup();
    downloadJSON(`gestion_entreprise_${backup.exportedAt.slice(0, 10)}.json`, backup);
    setError(warnings.length > 0 ? warnings.join(" ") : null);
    setNotice("Export téléchargé.");
  }, []);

  const handleImport = useCallback(async (file: File) => {
    try {
      const raw = JSON.parse(await file.text()) as unknown;
      if (!isEntrepriseBackup(raw)) {
        setNotice(null);
        setError(
          "Ce fichier n'est pas une sauvegarde Entreprise. Pour un budget du foyer, ouvrez Budget du foyer."
        );
        return;
      }
      const { warnings } = await importEntrepriseBackup(raw);
      setRevision((current) => current + 1);
      setError(warnings.length > 0 ? warnings.join(" ") : null);
      setNotice("Données entreprise importées.");
    } catch (err) {
      setNotice(null);
      setError(
        err instanceof SyntaxError
          ? "Fichier invalide : format JSON attendu."
          : err instanceof Error
            ? err.message
            : "Import impossible."
      );
    }
  }, []);

  if (!loaded) {
    return (
      <div className="mx-auto max-w-5xl">
        <p className="text-slate-500">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Gestion Entreprise"
        user={user}
        syncStatus={syncStatus}
        onExport={handleExport}
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
      
      <div className="flex flex-wrap gap-2 mb-5 no-print">
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            onClick={() => setActiveTool(tool.id)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              activeTool === tool.id
                ? "bg-blue-600 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {tool.label}
          </button>
        ))}
      </div>

      {activeTool === "freelance" && <FreelanceSimulatorCard key={`freelance-${revision}`} />}
      {activeTool === "statuts" && <StatusCompareCard key={`statuts-${revision}`} />}
      {activeTool === "gantt" && <GanttCard key={`gantt-${revision}`} />}
      {activeTool === "cashflow" && <CashFlowPlannerCard key={`cashflow-${revision}`} />}
    </div>
  );
}
