import { addCalendarMonths, formatIsoDate, parseActivityStart } from "./activity-calendar";

export interface GanttTask {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  category: "admin" | "finance" | "produit" | "commercial" | "rh";
  done: boolean;
  /** Ancien planning au mois, utilisé seulement tant que les dates ne sont pas saisies. */
  startMonth?: number;
  durationMonths?: number;
}

export function addDays(date: Date, count: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + count);
}

function dayIndex(date: Date): number {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000;
}

export function taskDates(task: Pick<GanttTask, "startDate" | "endDate" | "startMonth" | "durationMonths">, launch: Date): { start: Date; end: Date } {
  const start = parseActivityStart(task.startDate);
  const end = parseActivityStart(task.endDate);
  if (start && end) {
    return end < start ? { start, end: start } : { start, end };
  }
  const origin = new Date(launch.getFullYear(), launch.getMonth(), 1);
  const startMonth = Math.max(1, task.startMonth ?? 1);
  const duration = Math.max(1, task.durationMonths ?? 1);
  const legacyStart = addCalendarMonths(origin, startMonth - 1);
  const next = addCalendarMonths(origin, startMonth - 1 + duration);
  return { start: legacyStart, end: addDays(next, -1) };
}

export interface PlanningWindow {
  start: Date;
  end: Date;
}

/** Fenêtre qui contient le lancement et toutes les tâches, y compris celles d'avant. */
export function planningWindow(tasks: GanttTask[], launch: Date): PlanningWindow {
  let min = launch;
  let max = launch;
  for (const task of tasks) {
    const dates = taskDates(task, launch);
    if (dates.start < min) min = dates.start;
    if (dates.end > max) max = dates.end;
  }
  const start = addDays(min, -7);
  let end = addDays(max, 7);
  if (dayIndex(end) - dayIndex(start) < 28) end = addDays(start, 28);
  return { start, end };
}

export function datePercent(date: Date, window: PlanningWindow): number {
  const span = dayIndex(window.end) + 1 - dayIndex(window.start);
  return ((dayIndex(date) - dayIndex(window.start)) / span) * 100;
}

export function barPercent(start: Date, end: Date, window: PlanningWindow): { left: number; width: number } {
  const left = datePercent(start, window);
  const right = datePercent(addDays(end, 1), window);
  return { left, width: Math.max(right - left, 0.35) };
}

export function monthTicks(window: PlanningWindow): { date: Date; label: string }[] {
  const ticks: { date: Date; label: string }[] = [];
  let cursor = new Date(window.start.getFullYear(), window.start.getMonth(), 1);
  if (cursor < window.start) cursor = addCalendarMonths(cursor, 1);
  while (cursor <= window.end) {
    ticks.push({
      date: new Date(cursor),
      label: cursor.toLocaleDateString("fr-FR", { month: "short" }).replace(".", ""),
    });
    cursor = addCalendarMonths(cursor, 1);
  }
  return ticks;
}

function legacyTask(
  id: string,
  name: string,
  startMonth: number,
  durationMonths: number,
  category: GanttTask["category"],
): GanttTask {
  return { id, name, startDate: "", endDate: "", startMonth, durationMonths, category, done: false };
}

export const DEFAULT_TASKS: GanttTask[] = [
  legacyTask("statuts", "Choix du statut & rédaction des statuts", 1, 1, "admin"),
  legacyTask("immat", "Immatriculation (registre national des entreprises)", 1, 1, "admin"),
  legacyTask("compte", "Ouverture compte bancaire pro", 2, 1, "finance"),
  legacyTask("acre", "Demande ACRE / aides région", 2, 1, "finance"),
  legacyTask("assurances", "Assurances (RC pro, prévoyance)", 2, 1, "admin"),
  legacyTask("offres", "Création des offres / prix", 2, 2, "produit"),
  legacyTask("site", "Site web & identité visuelle", 3, 2, "commercial"),
  legacyTask("compta", "Mise en place comptabilité / facturation", 3, 1, "finance"),
  legacyTask("reseau", "Réseaux & partenariats", 4, 3, "commercial"),
  legacyTask("premiers-clients", "Signature des premiers clients", 5, 3, "commercial"),
  legacyTask("embauche", "Étude première embauche", 12, 2, "rh"),
  legacyTask("bilan1", "Bilan année 1 & ajustement prix", 12, 1, "finance"),
  legacyTask("developpement", "Développement de l'activité", 13, 12, "commercial"),
  legacyTask("bilan2", "Bilan année 2 & projection", 24, 1, "finance"),
];

export function formatTaskDay(date: Date): string {
  return date.toLocaleDateString("fr-FR");
}

export { formatIsoDate };

export const CATEGORY_COLORS: Record<GanttTask["category"], string> = {
  admin: "bg-slate-400",
  finance: "bg-blue-500",
  produit: "bg-purple-500",
  commercial: "bg-emerald-500",
  rh: "bg-amber-500",
};
