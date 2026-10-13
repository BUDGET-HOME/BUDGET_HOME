"use client";

import { useState } from "react";
import { CATEGORY_COLORS, DEFAULT_TASKS, type GanttTask } from "@/lib/gantt";

const MONTHS = 24;

export default function GanttCard() {
  const [tasks, setTasks] = useState<GanttTask[]>(DEFAULT_TASKS);
  const [name, setName] = useState("");
  const [startMonth, setStartMonth] = useState(1);
  const [duration, setDuration] = useState(2);
  const [category, setCategory] = useState<GanttTask["category"]>("admin");

  const addTask = () => {
    if (!name.trim()) return;
    setTasks((t) => [
      ...t,
      { id: `t-${Date.now()}`, name: name.trim(), startMonth, durationMonths: duration, category, done: false },
    ]);
    setName("");
  };

  const toggleDone = (id: string) =>
    setTasks((t) => t.map((task) => (task.id === id ? { ...task, done: !task.done } : task)));

  const removeTask = (id: string) =>
    setTasks((t) => t.filter((task) => task.id !== id));

  const yearLabel = (m: number) =>
    m <= 12 ? `A1-M${m}` : `A2-M${m - 12}`;

  return (
    <section className="budget-card">
      <h2 className="text-xl font-bold border-b-2 border-slate-100 pb-2 mb-5">
        Planning de lancement — 24 mois
      </h2>

      <div className="flex flex-wrap items-end gap-3 mb-5 no-print">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Nouvelle tâche</label>
          <input
            type="text"
            value={name}
            placeholder="Ex: Dépôt de marque"
            onChange={(e) => setName(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Début (mois)</label>
          <input
            type="number"
            min={1}
            max={MONTHS}
            value={startMonth}
            onChange={(e) => setStartMonth(parseInt(e.target.value) || 1)}
            className="rounded-md border border-slate-300 px-3 py-2 w-20"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Durée (mois)</label>
          <input
            type="number"
            min={1}
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
            className="rounded-md border border-slate-300 px-3 py-2 w-20"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Catégorie</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as GanttTask["category"])}
            className="rounded-md border border-slate-300 px-3 py-2"
          >
            <option value="admin">Administratif</option>
            <option value="finance">Finances</option>
            <option value="produit">Produit / Offre</option>
            <option value="commercial">Commercial</option>
            <option value="rh">RH</option>
          </select>
        </div>
        <button
          onClick={addTask}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          + Ajouter
        </button>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[720px]">
          <div className="flex text-xs text-slate-400 mb-1 pl-1">
            {Array.from({ length: MONTHS }, (_, i) => i + 1).map((m) => (
              <div key={m} className="w-8 text-center">
                {m % 3 === 1 ? yearLabel(m) : ""}
              </div>
            ))}
          </div>
          {tasks.map((task) => (
            <div key={task.id} className="flex items-center mb-1 group">
              <div className="w-64 shrink-0 pr-3 text-sm truncate" title={task.name}>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={task.done}
                    onChange={() => toggleDone(task.id)}
                    className="no-print"
                  />
                  <span className={task.done ? "line-through text-slate-400" : ""}>
                    {task.name}
                  </span>
                </label>
              </div>
              <div className="flex-1 relative h-6">
                <div
                  className={`absolute h-6 rounded ${CATEGORY_COLORS[task.category]} ${
                    task.done ? "opacity-40" : ""
                  }`}
                  style={{
                    left: `${((task.startMonth - 1) / MONTHS) * 100}%`,
                    width: `${(Math.min(task.durationMonths, MONTHS - task.startMonth + 1) / MONTHS) * 100}%`,
                  }}
                  title={`${task.name} : ${yearLabel(task.startMonth)} → ${yearLabel(
                    Math.min(task.startMonth + task.durationMonths - 1, MONTHS)
                  )}`}
                />
              </div>
              <button
                onClick={() => removeTask(task.id)}
                className="ml-2 rounded bg-red-100 text-red-500 px-2 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity no-print"
                title="Supprimer"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mt-4 text-xs text-slate-500">
        {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
          <span key={cat} className="flex items-center gap-1">
            <span className={`inline-block w-3 h-3 rounded ${color}`} />
            {cat === "admin"
              ? "Administratif"
              : cat === "finance"
                ? "Finances"
                : cat === "produit"
                  ? "Produit / Offre"
                  : cat === "commercial"
                    ? "Commercial"
                    : "RH"}
          </span>
        ))}
      </div>
    </section>
  );
}
