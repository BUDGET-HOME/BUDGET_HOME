"use client";

import { useState, useEffect, useLayoutEffect, useCallback, useMemo, useRef } from "react";
import { activityStartIso, parseActivityStart } from "@/lib/activity-calendar";
import {
  CATEGORY_COLORS,
  DEFAULT_TASKS,
  addDays,
  barPercent,
  datePercent,
  LAUNCH_ID,
  dependencyArrows,
  dependencyCreatesCycle,
  formatIsoDate,
  formatTaskDay,
  MILESTONE_TITLE_STEP,
  monthTicks,
  stackOverlappingLabels,
  planningWindow,
  scheduleDependencies,
  taskDates,
  type GanttKind,
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

const ROW_HEIGHT = 40;

export default function GanttCard() {
  const {
    data: savedData,
    loading: dataLoading,
    error: dataError,
    saving,
    saveData,
  } = useGanttData();
  const { data: freelanceData, saveField: saveActivityDate } = useFreelanceData();
  const activityStart = freelanceData?.activityStartDate ?? "";
  const hasActivityStart = activityStart.length > 0;
  const launch = useMemo(() => parseActivityStart(activityStart) ?? new Date(), [activityStart]);
  const launchIso = activityStartIso(activityStart, launch);

  const [tasks, setTasks] = useState<GanttTask[]>(DEFAULT_TASKS);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState(launchIso);
  const [endDate, setEndDate] = useState(formatIsoDate(addDays(launch, 30)));
  const [category, setCategory] = useState<GanttTask["category"]>("admin");
  const [kind, setKind] = useState<GanttKind>("task");
  const [dependsOn, setDependsOn] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formDirty, setFormDirty] = useState(false);
  const [notice, setNotice] = useState("");

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
    setKind("task");
    setDependsOn("");
    setFormDirty(false);
    setNotice("");
    setStartDate(launchIso);
    setEndDate(formatIsoDate(addDays(parseActivityStart(launchIso) ?? launch, 30)));
  }, [launch, launchIso]);

  const selectTask = useCallback((task: GanttTask) => {
    const dates = taskDates(task, launch);
    setEditingId(task.id);
    setName(task.name);
    setStartDate(formatIsoDate(dates.start));
    setEndDate(formatIsoDate(dates.end));
    setCategory(task.category);
    setKind(task.kind === "milestone" ? "milestone" : "task");
    setDependsOn(task.dependsOn);
    setFormDirty(true);
    setNotice("");
  }, [launch]);

  const commitTask = useCallback(() => {
    if (editingId === LAUNCH_ID) {
      if (!parseActivityStart(startDate)) return;
      saveActivityDate("activityStartDate", startDate);
      setEndDate(startDate);
      setName("Lancement");
      setKind("milestone");
      setDependsOn("");
      setNotice("Date de lancement enregistrée pour tous les onglets.");
      return;
    }
    if (!name.trim() || !parseActivityStart(startDate)) return;
    if (kind === "task" && !parseActivityStart(endDate)) return;
    const orderedStart = kind === "milestone" || startDate <= endDate ? startDate : endDate;
    const orderedEnd = kind === "milestone" ? orderedStart : startDate <= endDate ? endDate : startDate;
    const id = editingId ?? `t-${Date.now()}`;
    const previous = tasks.find((task) => task.id === id);
    const draft: GanttTask = {
      id,
      name: name.trim(),
      startDate: orderedStart,
      endDate: orderedEnd,
      category,
      done: previous?.done ?? false,
      kind,
      dependsOn: kind === "milestone" ? "" : dependsOn,
    };
    const pool = [...tasks.filter((task) => task.id !== id), draft];
    if (draft.dependsOn && dependencyCreatesCycle(pool, id, draft.dependsOn)) {
      setNotice("Cette dépendance formerait une boucle.");
      return;
    }
    const base = (tasks.some((task) => task.id === id)
      ? tasks.map((task) => (task.id === id ? draft : task))
      : [...tasks, draft]
    ).map((task) => (kind === "milestone" && task.dependsOn === id ? { ...task, dependsOn: "" } : task));
    const scheduled = scheduleDependencies(base, launch);
    const saved = scheduled.find((task) => task.id === id);
    setTasks(scheduled);
    saveData({ tasks: scheduled });
    if (saved && (saved.startDate !== orderedStart || saved.endDate !== orderedEnd)) {
      const predecessor = tasks.find((task) => task.id === dependsOn);
      setNotice(predecessor
        ? `Début décalé au ${formatTaskDay(parseActivityStart(saved.startDate) ?? launch)}, après « ${predecessor.name} ».`
        : "");
      setStartDate(saved.startDate);
      setEndDate(saved.endDate);
      setEditingId(id);
      setFormDirty(true);
      return;
    }
    if (editingId) {
      setStartDate(saved?.startDate ?? orderedStart);
      setEndDate(saved?.endDate ?? orderedEnd);
      setNotice("");
      return;
    }
    resetForm();
  }, [name, startDate, endDate, category, kind, dependsOn, editingId, tasks, saveData, saveActivityDate, launch, resetForm]);

  const toggleDone = useCallback((id: string) => {
    const newTasks = tasks.map((task) => (task.id === id ? { ...task, done: !task.done } : task));
    setTasks(newTasks);
    saveData({ tasks: newTasks });
  }, [tasks, saveData]);

  const removeSelected = useCallback(() => {
    if (!editingId || editingId === LAUNCH_ID) return;
    const newTasks = scheduleDependencies(
      tasks
        .filter((task) => task.id !== editingId)
        .map((task) => (task.dependsOn === editingId ? { ...task, dependsOn: "" } : task)),
      launch,
    );
    setTasks(newTasks);
    saveData({ tasks: newTasks });
    resetForm();
  }, [editingId, tasks, saveData, launch, resetForm]);

  const window = useMemo(() => planningWindow(tasks, launch), [tasks, launch]);
  const ticks = monthTicks(window);
  const taskRows = useMemo(() => tasks.filter((task) => task.kind !== "milestone"), [tasks]);
  const arrows = useMemo(() => dependencyArrows(taskRows, launch, window), [taskRows, launch, window]);
  const chartWidth = Math.max(860, ticks.length * 56);
  const chartBodyHeight = Math.max(taskRows.length * ROW_HEIGHT, 120);
  const launchRow = useMemo<GanttTask>(() => ({
    id: LAUNCH_ID,
    name: "Lancement",
    startDate: launchIso,
    endDate: launchIso,
    category: "admin",
    done: false,
    kind: "milestone",
    dependsOn: "",
  }), [launchIso]);
  const rows = useMemo(() => [launchRow, ...tasks], [launchRow, tasks]);
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const titleRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [titleOffsets, setTitleOffsets] = useState<Record<string, number>>({});
  const milestoneKey = rows
    .filter((task) => task.kind === "milestone")
    .map((task) => `${task.id}:${task.name}:${task.startDate}`)
    .join("|");

  useLayoutEffect(() => {
    if (dataLoading || dataError) return;
    const node = timelineRef.current;
    if (!node) return;
    const measure = () => {
      const boxes = Object.entries(titleRefs.current).flatMap(([id, element]) => {
        if (!element) return [];
        const rect = element.getBoundingClientRect();
        if (rect.width <= 0) return [];
        return [{ id, left: rect.left, right: rect.right }];
      });
      const next = stackOverlappingLabels(boxes);
      setTitleOffsets((current) => {
        const same = Object.keys(current).length === Object.keys(next).length
          && Object.entries(next).every(([id, offset]) => current[id] === offset);
        return same ? current : next;
      });
    };
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    measure();
    return () => observer.disconnect();
  }, [dataLoading, dataError, milestoneKey]);
  const jalonLaneCount = Math.max(
    1,
    ...rows.filter((task) => task.kind === "milestone").map((task) => (titleOffsets[task.id] ?? 0) / MILESTONE_TITLE_STEP + 1),
  );
  const jalonBandHeight = jalonLaneCount * MILESTONE_TITLE_STEP;
  const dependencyChoices = tasks.filter((task) => {
    const selfId = editingId ?? "new";
    if (task.kind === "milestone" || task.id === editingId) return false;
    return !dependencyCreatesCycle(
      [...tasks.filter((item) => item.id !== editingId).map((item) => ({ id: item.id, dependsOn: item.dependsOn })), { id: selfId, dependsOn }],
      selfId,
      task.id,
    );
  });

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
      <h2 className="text-xl font-bold border-b-2 border-slate-100 pb-2 mb-2">Planning</h2>
      {!hasActivityStart && (
        <p className="text-sm text-slate-600 mb-5">
          Cliquez le titre du jalon de lancement, puis enregistrez sa date pour la reprendre dans les autres onglets.
        </p>
      )}

      <div className="flex flex-wrap items-end gap-3 mb-2 no-print">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">
            {editingId ? "Élément sélectionné" : "Nouvel élément"}
          </label>
          <input
            type="text"
            value={editingId === LAUNCH_ID ? "Lancement" : name}
            placeholder="Ex: Dépôt de marque"
            disabled={editingId === LAUNCH_ID}
            onChange={(e) => { setName(e.target.value); setFormDirty(true); }}
            className="rounded-md border border-slate-300 px-3 py-2 disabled:bg-slate-100"
          />
        </div>
        <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <input
            type="checkbox"
            checked={kind === "milestone"}
            disabled={editingId === LAUNCH_ID}
            onChange={(e) => {
              const milestone = e.target.checked;
              setKind(milestone ? "milestone" : "task");
              if (milestone) {
                setEndDate(startDate);
                setDependsOn("");
              }
              setFormDirty(true);
            }}
          />
          Jalon
        </label>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">{kind === "milestone" ? "Date" : "Début"}</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              if (kind === "milestone") setEndDate(e.target.value);
              setFormDirty(true);
            }}
            className="rounded-md border border-slate-300 px-3 py-2"
          />
        </div>
        {kind === "task" && (
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Fin</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setFormDirty(true); }}
              className="rounded-md border border-slate-300 px-3 py-2"
            />
          </div>
        )}
        {editingId !== LAUNCH_ID && <div>
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
        </div>}
        {kind === "task" && <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Attend la fin de</label>
          <select
            value={dependsOn}
            onChange={(e) => { setDependsOn(e.target.value); setFormDirty(true); }}
            className="rounded-md border border-slate-300 px-3 py-2"
          >
            <option value="">Aucune</option>
            {dependencyChoices.map((task) => (
              <option key={task.id} value={task.id}>{task.name}</option>
            ))}
          </select>
        </div>}
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
            Nouvelle
          </button>
        )}
      </div>
      {notice && <p className="mb-4 text-sm text-amber-800">{notice}</p>}

      <div className="overflow-x-auto">
        <div className="flex" style={{ minWidth: chartWidth }}>
          <div className="w-8 shrink-0">
            <div className="h-8" />
            <div className="flex items-start justify-center bg-yellow-100" style={{ height: jalonBandHeight }}>
              {editingId && editingId !== LAUNCH_ID && tasks.some((task) => task.id === editingId && task.kind === "milestone") && (
                <button
                  onClick={removeSelected}
                  className="rounded bg-red-100 px-1.5 text-sm font-bold text-red-600 no-print"
                  title="Supprimer"
                >
                  ×
                </button>
              )}
            </div>
            {taskRows.map((task) => (
              <div key={task.id} className="flex h-10 items-center justify-center">
                {editingId === task.id && (
                  <button
                    onClick={removeSelected}
                    className="rounded bg-red-100 px-1.5 text-sm font-bold text-red-600 no-print"
                    title="Supprimer"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="w-64 shrink-0 pr-3">
            <div className="h-8" />
            <div className="flex items-start bg-yellow-100 text-[10px] font-bold uppercase leading-[14px] tracking-wider text-rose-700" style={{ height: jalonBandHeight }}>
              Jalon
            </div>
            {taskRows.map((task) => {
              const dates = taskDates(task, launch);
              return (
                <div
                  key={task.id}
                  onClick={() => selectTask(task)}
                  className={`flex h-10 w-full cursor-pointer items-center gap-2 overflow-hidden text-left text-sm ${editingId === task.id ? "rounded bg-blue-50" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={task.done}
                    onChange={() => toggleDone(task.id)}
                    onClick={(event) => event.stopPropagation()}
                    className="no-print"
                  />
                  <span className="min-w-0">
                    <span className={`block truncate ${task.done ? "line-through text-slate-400" : ""}`}>
                      {task.name}
                    </span>
                    <span className="block truncate text-[11px] text-slate-500">
                      {`${formatTaskDay(dates.start)} → ${formatTaskDay(dates.end)}`}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
          <div ref={timelineRef} className="relative min-w-0 flex-1">
            <div className="relative h-8 border-b border-slate-100">
              {ticks.map((tick) => (
                <span
                  key={formatIsoDate(tick.date)}
                  className="absolute top-4 -translate-x-1/2 text-[10px] text-slate-400"
                  style={{ left: `${datePercent(tick.date, window)}%` }}
                >
                  {tick.label}
                </span>
              ))}
            </div>
            <div className="relative">
            <div className="border-b border-yellow-200 bg-yellow-100" style={{ height: jalonBandHeight }} />
            <div className="relative" style={{ height: chartBodyHeight }}>
              {taskRows.map((task) => {
                const dates = taskDates(task, launch);
                const bar = barPercent(dates.start, dates.end, window);
                return (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => selectTask(task)}
                    className="relative block h-10 w-full"
                  >
                    {editingId === task.id && <span className="absolute inset-x-0 top-1 h-8 rounded bg-blue-100/40" />}
                    {task.kind !== "milestone" && (
                      <span
                        className={`absolute top-2 h-6 rounded ${CATEGORY_COLORS[task.category]} ${task.done ? "opacity-40" : ""}`}
                        style={{ left: `${bar.left}%`, width: `${bar.width}%` }}
                        title={`${task.name} : ${formatTaskDay(dates.start)} → ${formatTaskDay(dates.end)}`}
                      />
                    )}
                  </button>
                );
              })}
              <svg
                className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
                viewBox={`0 0 100 ${chartBodyHeight}`}
                preserveAspectRatio="none"
              >
                {arrows.map((arrow) => {
                  const y1 = arrow.fromRow * ROW_HEIGHT + ROW_HEIGHT / 2;
                  const y2 = arrow.toRow * ROW_HEIGHT + ROW_HEIGHT / 2;
                  const leave = Math.min(arrow.fromX + 1.5, 99);
                  return (
                    <polyline
                      key={arrow.id}
                      points={`${arrow.fromX},${y1} ${leave},${y1} ${leave},${y2} ${arrow.toX},${y2}`}
                      fill="none"
                      stroke="#334155"
                      strokeWidth="1.5"
                      vectorEffect="non-scaling-stroke"
                    />
                  );
                })}
              </svg>
              {arrows.map((arrow) => {
                const leave = Math.min(arrow.fromX + 1.5, 99);
                const pointsRight = arrow.toX >= leave;
                return (
                  <span
                    key={`${arrow.id}-head`}
                    className="pointer-events-none absolute h-0 w-0 border-y-4 border-y-transparent border-l-[7px] border-l-slate-700"
                    style={{
                      left: `${arrow.toX}%`,
                      top: arrow.toRow * ROW_HEIGHT + ROW_HEIGHT / 2,
                      transform: pointsRight ? "translate(-7px, -4px)" : "translate(0, -4px) rotate(180deg)",
                    }}
                  />
                );
              })}
            </div>
            {rows.filter((task) => task.kind === "milestone").map((task) => {
              const dates = taskDates(task, launch);
              const point = datePercent(dates.start, window);
              const label = formatTaskDay(dates.start);
              const offset = titleOffsets[task.id] ?? 0;
              return (
                <div
                  key={`${task.id}-line`}
                  className="pointer-events-none absolute bottom-0 z-10 w-0.5 bg-rose-600"
                  style={{ left: `${point}%`, top: offset }}
                >
                  <button
                    type="button"
                    ref={(node) => { titleRefs.current[task.id] = node; }}
                    onClick={() => selectTask(task)}
                    title={`${task.name} : ${label}`}
                    className={`pointer-events-auto absolute top-0 whitespace-nowrap text-[10px] font-bold leading-[14px] text-rose-700 ${point > 78 ? "right-1" : "left-1"} ${editingId === task.id ? "underline" : ""}`}
                  >
                    {task.name}
                  </button>
                </div>
              );
            })}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-0.5 bg-rose-600" />
          Jalon
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-0 w-4 border-t-2 border-slate-700" />
          Dépendance
        </span>
        {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
          <span key={cat} className="flex items-center gap-1">
            <span className={`inline-block h-3 w-3 rounded ${color}`} />
            {CATEGORY_LABELS[cat as GanttTask["category"]]}
          </span>
        ))}
      </div>

      {saving && (
        <div className="fixed bottom-4 right-4 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white shadow-lg">
          Sauvegarde en cours...
        </div>
      )}
    </section>
  );
}
