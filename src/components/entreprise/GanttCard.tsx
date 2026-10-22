"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { activityStartIso, parseActivityStart } from "@/lib/activity-calendar";
import {
  CATEGORY_COLORS,
  DEFAULT_TASKS,
  addDays,
  barPercent,
  datePercent,
  formatIsoDate,
  formatTaskDay,
  monthTicks,
  planningWindow,
  taskDates,
  type GanttTask,
} from "@/lib/gantt";
import { useFreelanceData } from "@/hooks/useFreelanceData";
import { useGanttData } from "@/hooks/useGanttData";

const CATEGORY_LABELS: Record<GanttTask["category"], string> = {
  admin: "Administratif",
  finance: "Finances",
  produit: "Produit / Offre",
  commercial: "Commercial",
  rh: "RH",
};

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
  const hasActivityStart = activityStart.length > 0;
  const launch = useMemo(() => parseActivityStart(activityStart) ?? new Date(), [activityStart]);
  const launchIso = activityStartIso(activityStart, launch);

  const [tasks, setTasks] = useState<GanttTask[]>(DEFAULT_TASKS);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState(launchIso);
  const [endDate, setEndDate] = useState(formatIsoDate(addDays(launch, 30)));
  const [category, setCategory] = useState<GanttTask["category"]>("admin");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formDirty, setFormDirty] = useState(false);

  useEffect(() => {
    if (savedData?.tasks) setTasks(savedData.tasks);
  }, [savedData?.tasks]);

  useEffect(() => {
    if (formDirty || editingId) return;
    setStartDate(launchIso);
    setEndDate(formatIsoDate(addDays(parseActivityStart(launchIso) ?? new Date(), 30)));
  }, [launchIso, formDirty, editingId]);

  const resetForm = useCallback(() => {
    setEditingId(null);
    setName("");
    setCategory("admin");
    setFormDirty(false);
    setStartDate(launchIso);
    setEndDate(formatIsoDate(addDays(parseActivityStart(launchIso) ?? launch, 30)));
  }, [launch, launchIso]);

  const commitTask = useCallback(() => {
    if (!name.trim() || !parseActivityStart(startDate) || !parseActivityStart(endDate)) return;
    const orderedStart = startDate <= endDate ? startDate : endDate;
    const orderedEnd = startDate <= endDate ? endDate : startDate;
    const previous = editingId ? tasks.find((task) => task.id === editingId) : undefined;
    const next: GanttTask = {
      id: editingId ?? `t-${Date.now()}`,
      name: name.trim(),
      startDate: orderedStart,
      endDate: orderedEnd,
      category,
      done: previous?.done ?? false,
    };
    const newTasks = editingId
      ? tasks.map((task) => (task.id === editingId ? next : task))
      : [...tasks, next];
    setTasks(newTasks);
    saveData({ tasks: newTasks });
    resetForm();
  }, [name, startDate, endDate, category, editingId, tasks, saveData, resetForm]);

  const beginEdit = useCallback((task: GanttTask) => {
    const dates = taskDates(task, launch);
    setEditingId(task.id);
    setName(task.name);
    setStartDate(formatIsoDate(dates.start));
    setEndDate(formatIsoDate(dates.end));
    setCategory(task.category);
    setFormDirty(true);
  }, [launch]);

  const toggleDone = useCallback((id: string) => {
    const newTasks = tasks.map((task) => (task.id === id ? { ...task, done: !task.done } : task));
    setTasks(newTasks);
    saveData({ tasks: newTasks });
  }, [tasks, saveData]);

  const removeTask = useCallback((id: string) => {
    const newTasks = tasks.filter((task) => task.id !== id);
    setTasks(newTasks);
    saveData({ tasks: newTasks });
    if (editingId === id) resetForm();
  }, [tasks, saveData, editingId, resetForm]);

  const window = useMemo(() => planningWindow(tasks, launch), [tasks, launch]);
  const ticks = monthTicks(window);
  const launchPct = datePercent(launch, window);
  const chartWidth = Math.max(860, ticks.length * 56);

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
        Planning de lancement
      </h2>
      <p className="text-sm text-slate-600 mb-5">
        {hasActivityStart
          ? `Le trait rouge marque le lancement du ${formatTaskDay(launch)}. Une tâche peut commencer avant cette date.`
          : "Début d'activité non renseigné : le trait rouge est placé sur aujourd'hui. Saisissez la date dans le simulateur freelance."}
      </p>

      <div className="flex flex-wrap items-end gap-3 mb-5 no-print">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">
            {editingId ? "Modifier la tâche" : "Nouvelle tâche"}
          </label>
          <input
            type="text"
            value={name}
            placeholder="Ex: Dépôt de marque"
            onChange={(e) => { setName(e.target.value); setFormDirty(true); }}
            className="rounded-md border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Début</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setFormDirty(true); }}
            className="rounded-md border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Fin</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setFormDirty(true); }}
            className="rounded-md border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Catégorie</label>
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value as GanttTask["category"]); setFormDirty(true); }}
            className="rounded-md border border-slate-300 px-3 py-2"
          >
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <button
          onClick={commitTask}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          {editingId ? "Enregistrer" : "+ Ajouter"}
        </button>
        {editingId && (
          <button
            onClick={resetForm}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Annuler
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <div style={{ minWidth: chartWidth }}>
          <div className="grid grid-cols-[16rem_1fr_9rem] items-center gap-y-1">
            <div />
            <div className="relative h-8">
              {ticks.map((tick) => (
                <span
                  key={formatIsoDate(tick.date)}
                  className="absolute top-4 -translate-x-1/2 text-[10px] text-slate-400"
                  style={{ left: `${datePercent(tick.date, window)}%` }}
                >
                  {tick.label}
                </span>
              ))}
              <div
                className="pointer-events-none absolute bottom-0 top-3 z-10 w-0.5 bg-rose-600"
                style={{ left: `${launchPct}%` }}
                title={`Lancement ${formatTaskDay(launch)}`}
              >
                <span className={`absolute -top-3 whitespace-nowrap text-[10px] font-bold text-rose-700 ${launchPct > 78 ? "right-1" : "left-1"}`}>
                  Lancement
                </span>
              </div>
            </div>
            <div />

            {tasks.map((task) => {
              const dates = taskDates(task, launch);
              const bar = barPercent(dates.start, dates.end, window);
              return (
                <div key={task.id} className="contents">
                  <div className={`pr-3 text-sm ${editingId === task.id ? "rounded bg-blue-50" : ""}`} title={task.name}>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={task.done}
                        onChange={() => toggleDone(task.id)}
                        className="no-print"
                      />
                      <span className="min-w-0">
                        <span className={`block truncate ${task.done ? "line-through text-slate-400" : ""}`}>{task.name}</span>
                        <span className="block text-[11px] text-slate-500">
                          {formatTaskDay(dates.start)} → {formatTaskDay(dates.end)}
                        </span>
                      </span>
                    </label>
                  </div>
                  <div className="relative h-8">
                    <div
                      className={`absolute top-1 h-6 rounded ${CATEGORY_COLORS[task.category]} ${task.done ? "opacity-40" : ""}`}
                      style={{ left: `${bar.left}%`, width: `${bar.width}%` }}
                      title={`${task.name} : ${formatTaskDay(dates.start)} → ${formatTaskDay(dates.end)}`}
                    />
                    <div
                      className="pointer-events-none absolute inset-y-0 z-10 w-0.5 bg-rose-600"
                      style={{ left: `${launchPct}%` }}
                    />
                  </div>
                  <div className="flex justify-end gap-1 no-print">
                    <button
                      onClick={() => beginEdit(task)}
                      className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => removeTask(task.id)}
                      className="rounded bg-red-100 px-2 py-0.5 text-xs text-red-500"
                      title="Supprimer"
                    >
                      ×
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mt-4 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-0.5 bg-rose-600" />
          Lancement
        </span>
        {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
          <span key={cat} className="flex items-center gap-1">
            <span className={`inline-block w-3 h-3 rounded ${color}`} />
            {CATEGORY_LABELS[cat as GanttTask["category"]]}
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
