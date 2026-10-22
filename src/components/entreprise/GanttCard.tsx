"use client";

import { useState, useEffect, useCallback } from "react";
import { activityMonthStart, addCalendarMonths, formatActivityMonth } from "@/lib/activity-calendar";
import { CATEGORY_COLORS, DEFAULT_TASKS, type GanttTask } from "@/lib/gantt";
import { useFreelanceData } from "@/hooks/useFreelanceData";
import { useGanttData } from "@/hooks/useGanttData";

const MONTHS = 24;

export default function GanttCard() {
  const {
    data: savedData,
    loading: dataLoading,
    error: dataError,
    saving,
    saveData,
  } = useGanttData();
  const { data: freelanceData } = useFreelanceData();
  const activityStart = freelanceData?.activityStartDate ?? "";
  const origin = activityMonthStart(activityStart);
  const hasActivityStart = activityStart.length > 0;

  // Local state for inputs (not auto-saved)
  const [tasks, setTasks] = useState<GanttTask[]>(DEFAULT_TASKS);
  const [name, setName] = useState("");
  const [startMonth, setStartMonth] = useState(1);
  const [duration, setDuration] = useState(2);
  const [category, setCategory] = useState<GanttTask["category"]>("admin");

  // Sync with saved data
  useEffect(() => {
    if (savedData?.tasks) {
      setTasks(savedData.tasks);
    }
  }, [savedData?.tasks]);

  const addTask = useCallback(() => {
    if (!name.trim()) return;
    const newTask: GanttTask = {
      id: `t-${Date.now()}`,
      name: name.trim(),
      startMonth,
      durationMonths: duration,
      category,
      done: false,
    };
    const newTasks = [...tasks, newTask];
    setTasks(newTasks);
    setName("");
    saveData({ tasks: newTasks });
  }, [name, startMonth, duration, category, tasks, saveData]);

  const toggleDone = useCallback((id: string) => {
    const newTasks = tasks.map((task) =>
      task.id === id ? { ...task, done: !task.done } : task
    );
    setTasks(newTasks);
    saveData({ tasks: newTasks });
  }, [tasks, saveData]);

  const removeTask = useCallback((id: string) => {
    const newTasks = tasks.filter((task) => task.id !== id);
    setTasks(newTasks);
    saveData({ tasks: newTasks });
  }, [tasks, saveData]);

  const monthDate = (monthNumber: number) => addCalendarMonths(origin, monthNumber - 1);
  const axisLabel = (monthNumber: number) =>
    monthDate(monthNumber).toLocaleDateString("fr-FR", { month: "short" }).replace(".", "");

  if (dataLoading) {
    return (
      <section className="budget-card">
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2" />
            <p className="text-slate-500">Chargement des données...</p>
          </div>
        </div>
      </section>
    );
  }

  if (dataError) {
    return (
      <section className="budget-card">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {dataError}
        </div>
      </section>
    );
  }

  return (
    <section className="budget-card">
      <h2 className="text-xl font-bold border-b-2 border-slate-100 pb-2 mb-2">
        Planning de lancement — 24 mois
      </h2>
      <p className="text-sm text-slate-600 mb-5">
        {hasActivityStart
          ? `Mois 1 = ${formatActivityMonth(origin)}. Le planning court jusqu'en ${formatActivityMonth(addCalendarMonths(origin, 23))}.`
          : "Début d'activité non renseigné : le mois 1 est le mois en cours. Saisissez la date dans le simulateur freelance."}
      </p>

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
          <label className="block text-xs font-semibold text-slate-500 mb-1">Début (mois 1 = {formatActivityMonth(origin)})</label>
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
          <div className="flex text-xs text-slate-400 mb-1">
            <div className="w-64 shrink-0" />
            <div className="flex flex-1">
              {Array.from({ length: MONTHS }, (_, i) => i + 1).map((m) => (
                <div key={m} className="flex-1 text-center truncate" title={formatActivityMonth(monthDate(m))}>
                  {m % 3 === 1 ? axisLabel(m) : ""}
                </div>
              ))}
            </div>
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
                  title={`${task.name} : ${formatActivityMonth(monthDate(task.startMonth))} → ${formatActivityMonth(
                    monthDate(Math.min(task.startMonth + task.durationMonths - 1, MONTHS))
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

      {saving && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
          Sauvegarde en cours...
        </div>
      )}
    </section>
  );
}
