"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { SyncStatus } from "@/lib/budget-service";
import type { BudgetState } from "@/lib/types";
import LaunchSimCard from "./LaunchSimCard";
import GanttCard from "./GanttCard";
import RevenueSimCard from "./RevenueSimCard";
import StatusCompareCard from "./StatusCompareCard";
import FreelanceSimulatorCard from "./FreelanceSimulatorCard";
import EntrepriseHeader from "./EntrepriseHeader";

const TOOLS = [
  { id: "lancement", label: "Simulateur de lancement" },
  { id: "gantt", label: "Planning de lancement" },
  { id: "revenus", label: "Simulateur de revenus" },
  { id: "statuts", label: "Choix du statut" },
  { id: "freelance", label: "Simulateur Freelance" },
] as const;

type ToolId = (typeof TOOLS)[number]["id"];

export default function EntrepriseApp() {
  const [activeTool, setActiveTool] = useState<ToolId>("lancement");
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser || null);
      setLoaded(true);
    };
    fetchUser();
  }, []);

  const handleImport = useCallback(async (file: File) => {
    alert("Import - Fonctionnalité à implémenter pour Entreprise");
  }, []);

  // Dummy state for header - Entreprise doesn't use BudgetState
  const dummyState: BudgetState = {
    name1: "",
    name2: "",
    salary1: "",
    salary2: "",
    force5050: false,
    mode: "separe",
    expenses: [],
    immo: {
      immoApport: 0,
      immoRate: 0,
      immoInsurance: 0,
      immoDuration: 0,
      immoType: "ancien",
    },
    loan: {
      capital: 0,
      rate: 0,
      durationMonths: 0,
      monthlyPayment: 0,
      offeredTaeg: 0,
      startDate: "",
      insuranceMode: "capital",
      insuranceRate: 0,
      insuranceAvgMonthly: 0,
      guaranteeFees: 0,
      brokerFees: 0,
      fileFees: 0,
    },
  };

  if (!loaded) {
    return (
      <div className="mx-auto max-w-5xl">
        <p className="text-slate-500">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <EntrepriseHeader 
        user={user} 
        syncStatus={syncStatus} 
        state={dummyState} 
        onImport={handleImport} 
      />
      
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

      {activeTool === "lancement" && <LaunchSimCard />}
      {activeTool === "gantt" && <GanttCard />}
      {activeTool === "revenus" && <RevenueSimCard />}
      {activeTool === "statuts" && <StatusCompareCard />}
      {activeTool === "freelance" && <FreelanceSimulatorCard />}
    </div>
  );
}
