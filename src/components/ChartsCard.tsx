"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Chart,
  ArcElement,
  BarElement,
  CategoryScale,
  DoughnutController,
  LinearScale,
  PieController,
  BarController,
  Tooltip,
  Legend,
  type ChartConfiguration,
} from "chart.js";
import { summarizeExpenses, formatEUR, loanPeriodAmount, type ViewMode } from "@/lib/budget";
import { LOAN_CATEGORY, type BudgetState } from "@/lib/types";

Chart.register(
  ArcElement,
  BarElement,
  CategoryScale,
  DoughnutController,
  LinearScale,
  PieController,
  BarController,
  Tooltip,
  Legend
);

const CATEGORY_COLORS = [
  "#2563eb",
  "#db2777",
  "#10b981",
  "#f59e0b",
  "#7c3aed",
  "#0ea5e9",
  "#ef4444",
  "#14b8a6",
  "#8b5cf6",
  "#f97316",
  "#06b6d4",
  "#84cc16",
  "#ec4899",
  "#64748b",
];

interface Props {
  state: BudgetState;
}

export default function ChartsCard({ state }: Props) {
  const [mode, setMode] = useState<ViewMode>("monthly");

  const summary = useMemo(
    () => summarizeExpenses(state.expenses),
    [state.expenses]
  );
  const loanAmount = useMemo(
    () => loanPeriodAmount(state.loan, mode),
    [state.loan, mode]
  );
  const loanActive = loanAmount > 0;

  const pieRef = useRef<HTMLCanvasElement>(null);
  const barRef = useRef<HTMLCanvasElement>(null);
  const payerRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const div = mode === "monthly" ? 12 : 1;
    const entries = Object.entries(summary.categoryTotals)
      .map(([k, v]) => [k, v / div] as [string, number])
      .sort((a, b) => b[1] - a[1]);
    if (loanAmount > 0) {
      entries.push([LOAN_CATEGORY, loanAmount]);
      entries.sort((a, b) => b[1] - a[1]);
    }

    const created: Chart[] = [];

    if (pieRef.current) {
      const config: ChartConfiguration = {
        type: "pie",
        data: {
          labels: entries.map(([k]) => k),
          datasets: [
            {
              data: entries.map(([, v]) => v),
              backgroundColor: CATEGORY_COLORS,
              borderWidth: 2,
              borderColor: "#ffffff",
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: "right", labels: { boxWidth: 14, font: { size: 11 } } },
            tooltip: {
              callbacks: {
                label: (ctx) =>
                  ` ${ctx.label} : ${formatEUR(ctx.parsed as number)}`,
              },
            },
          },
        },
      };
      created.push(new Chart(pieRef.current, config));
    }

    if (barRef.current) {
      const config: ChartConfiguration = {
        type: "bar",
        data: {
          labels: entries.map(([k]) => k.split(" ").slice(1).join(" ")),
          datasets: [
            {
              data: entries.map(([, v]) => v),
              backgroundColor: CATEGORY_COLORS,
              borderRadius: 4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: "y",
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => ` ${formatEUR(Number(ctx.parsed.x))}`,
              },
            },
          },
          scales: { x: { grid: { display: false } }, y: { grid: { display: false } } },
        },
      };
      created.push(new Chart(barRef.current, config));
    }

    if (payerRef.current && state.mode === "separe") {
      const p1 = summary.paidAnnual1 / div;
      const p2 = summary.paidAnnual2 / div;
      const config: ChartConfiguration = {
        type: "doughnut",
        data: {
          labels: [state.name1, state.name2],
          datasets: [
            {
              data: [p1, p2],
              backgroundColor: ["#2563eb", "#db2777"],
              borderWidth: 2,
              borderColor: "#ffffff",
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: "bottom" },
            tooltip: {
              callbacks: {
                label: (ctx) => ` ${formatEUR(Number(ctx.parsed))}`,
              },
            },
          },
        },
      };
      created.push(new Chart(payerRef.current, config));
    }

    return () => {
      created.forEach((c) => c.destroy());
    };
  }, [summary, mode, state.mode, state.name1, state.name2, loanAmount]);

  return (
    <section className="budget-card">
      <div className="flex flex-wrap justify-between items-center border-b-2 border-slate-100 pb-2 mb-5 gap-3">
        <h2 className="text-xl font-bold">📊 Analyse des dépenses</h2>
        <div className="flex rounded-lg bg-slate-100 p-1">
          <button
            onClick={() => setMode("monthly")}
            className={`px-4 py-1.5 text-sm font-semibold rounded-md ${
              mode === "monthly" ? "bg-white shadow text-blue-600" : "text-slate-500"
            }`}
          >
            Mensuel
          </button>
          <button
            onClick={() => setMode("annual")}
            className={`px-4 py-1.5 text-sm font-semibold rounded-md ${
              mode === "annual" ? "bg-white shadow text-blue-600" : "text-slate-500"
            }`}
          >
            Annuel
          </button>
        </div>
      </div>

      {state.expenses.length === 0 && !loanActive ? (
        <p className="py-6 text-center text-slate-400">
          Ajoutez des dépenses pour voir les graphiques.
        </p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-bold text-slate-600 mb-2">
              Répartition par catégorie
            </h3>
            <div className="h-72">
              <canvas ref={pieRef} />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-600 mb-2">
              Top catégories
            </h3>
            <div className="h-72">
              <canvas ref={barRef} />
            </div>
          </div>
          {state.mode === "separe" && (
            <div className="lg:col-span-2">
              <h3 className="text-sm font-bold text-slate-600 mb-2">
                Qui paie quoi
              </h3>
              <div className="h-56 max-w-md mx-auto">
                <canvas ref={payerRef} />
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
