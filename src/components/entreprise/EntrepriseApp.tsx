"use client";

import { useState } from "react";
import LaunchSimCard from "./LaunchSimCard";
import GanttCard from "./GanttCard";
import RevenueSimCard from "./RevenueSimCard";
import StatusCompareCard from "./StatusCompareCard";
import FreelanceSimulatorCard from "./FreelanceSimulatorCard";

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

  return (
    <div className="mx-auto max-w-5xl">
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
