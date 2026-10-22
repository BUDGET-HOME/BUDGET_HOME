import { DEFAULT_TASKS, type GanttTask } from "./gantt";
import {
  ENTREPRISE_BACKUP_KIND,
  type CashFlowBackup,
  type CashFlowBackupItem,
  type EntrepriseBackup,
  isEntrepriseBackup,
  parseCashFlow,
  parseEntrepriseBackup,
} from "./entreprise-backup";

export interface FreelanceData {
  status: string;
  tjm: number;
  days: number;
  costRetirement: number;
  costLld: number;
  costFuel: number;
  costMutuelle: number;
  costBankIns: number;
  costAccountant: number;
  pctPortage: number;
  costMeals: number;
  costTelecom: number;
  costTech: number;
  acre: boolean;
  fiscalParts: number;
  areToggle: boolean;
  salaryGross: number;
  salaryBonus: number;
  salaryMonths: number;
  userAge: number;
  useSpouseMutuelle: boolean;
  activityStartDate: string;
  contractEndDate: string;
  areWorkedDays: number;
  areInactivityDays: number;
  areExcludedDays: number;
  arePartTime: number;
  arePaidLeave: number;
  areSeverance: number;
  areRightsUsed: number;
  areOverseas: boolean;
  areIndividualAgreement: boolean;
  areReducedMinimum: boolean;
  areEconomicLayoff: boolean;
  areWaitingServed: boolean;
  arceSecondPayment: boolean;
  tvaRate: number;
}

export interface EntrepriseState {
  freelance: FreelanceData;
  gantt: { tasks: GanttTask[] };
  cashFlow: CashFlowBackup;
}

export const DEFAULT_FREELANCE: FreelanceData = {
  status: "auto",
  tjm: 480,
  days: 18,
  costRetirement: 300,
  costLld: 450,
  costFuel: 150,
  costMutuelle: 80,
  costBankIns: 45,
  costAccountant: 150,
  pctPortage: 7,
  costMeals: 200,
  costTelecom: 50,
  costTech: 50,
  acre: true,
  fiscalParts: 1,
  areToggle: false,
  salaryGross: 3500,
  salaryBonus: 0,
  salaryMonths: 12,
  userAge: 35,
  useSpouseMutuelle: false,
  activityStartDate: "",
  contractEndDate: "",
  areWorkedDays: 730,
  areInactivityDays: 0,
  areExcludedDays: 0,
  arePartTime: 100,
  arePaidLeave: 0,
  areSeverance: 0,
  areRightsUsed: 0,
  areOverseas: false,
  areIndividualAgreement: false,
  areReducedMinimum: false,
  areEconomicLayoff: false,
  areWaitingServed: false,
  arceSecondPayment: true,
  tvaRate: 0,
};

const EMPTY_CASH_FLOW: CashFlowBackup = { items: [], initialBalance: 0 };

const TASK_CATEGORIES: GanttTask["category"][] = [
  "admin",
  "finance",
  "produit",
  "commercial",
  "rh",
];

const FREELANCE_FIELDS: {
  camel: keyof FreelanceData;
  snake: string;
  kind: "string" | "number" | "boolean";
}[] = [
  { camel: "status", snake: "status", kind: "string" },
  { camel: "tjm", snake: "tjm", kind: "number" },
  { camel: "days", snake: "days", kind: "number" },
  { camel: "costRetirement", snake: "cost_retirement", kind: "number" },
  { camel: "costLld", snake: "cost_lld", kind: "number" },
  { camel: "costFuel", snake: "cost_fuel", kind: "number" },
  { camel: "costMutuelle", snake: "cost_mutuelle", kind: "number" },
  { camel: "costBankIns", snake: "cost_bank_ins", kind: "number" },
  { camel: "costAccountant", snake: "cost_accountant", kind: "number" },
  { camel: "pctPortage", snake: "pct_portage", kind: "number" },
  { camel: "costMeals", snake: "cost_meals", kind: "number" },
  { camel: "costTelecom", snake: "cost_telecom", kind: "number" },
  { camel: "costTech", snake: "cost_tech", kind: "number" },
  { camel: "acre", snake: "acre", kind: "boolean" },
  { camel: "fiscalParts", snake: "fiscal_parts", kind: "number" },
  { camel: "areToggle", snake: "are_toggle", kind: "boolean" },
  { camel: "salaryGross", snake: "salary_gross", kind: "number" },
  { camel: "salaryBonus", snake: "salary_bonus", kind: "number" },
  { camel: "salaryMonths", snake: "salary_months", kind: "number" },
  { camel: "userAge", snake: "user_age", kind: "number" },
  { camel: "useSpouseMutuelle", snake: "use_spouse_mutuelle", kind: "boolean" },
  { camel: "activityStartDate", snake: "activity_start_date", kind: "string" },
  { camel: "contractEndDate", snake: "contract_end_date", kind: "string" },
  { camel: "areWorkedDays", snake: "are_worked_days", kind: "number" },
  { camel: "areInactivityDays", snake: "are_inactivity_days", kind: "number" },
  { camel: "areExcludedDays", snake: "are_excluded_days", kind: "number" },
  { camel: "arePartTime", snake: "are_part_time", kind: "number" },
  { camel: "arePaidLeave", snake: "are_paid_leave", kind: "number" },
  { camel: "areSeverance", snake: "are_severance", kind: "number" },
  { camel: "areRightsUsed", snake: "are_rights_used", kind: "number" },
  { camel: "areOverseas", snake: "are_overseas", kind: "boolean" },
  { camel: "areIndividualAgreement", snake: "are_individual_agreement", kind: "boolean" },
  { camel: "areReducedMinimum", snake: "are_reduced_minimum", kind: "boolean" },
  { camel: "areEconomicLayoff", snake: "are_economic_layoff", kind: "boolean" },
  { camel: "areWaitingServed", snake: "are_waiting_served", kind: "boolean" },
  { camel: "arceSecondPayment", snake: "arce_second_payment", kind: "boolean" },
  { camel: "tvaRate", snake: "tva_rate", kind: "number" },
];

export function defaultEntreprise(): EntrepriseState {
  return {
    freelance: { ...DEFAULT_FREELANCE },
    gantt: { tasks: DEFAULT_TASKS.map((task) => ({ ...task })) },
    cashFlow: { items: [], initialBalance: 0 },
  };
}

export function finiteNumber(value: unknown, fallback: number): number {
  const parsed = typeof value === "string" ? parseFloat(value) : value;
  return typeof parsed === "number" && Number.isFinite(parsed) ? parsed : fallback;
}

function booleanValue(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function readAlias(row: Record<string, unknown>, camel: string, snake: string): unknown {
  if (Object.prototype.hasOwnProperty.call(row, camel)) return row[camel];
  if (Object.prototype.hasOwnProperty.call(row, snake)) return row[snake];
  return undefined;
}

export function freelanceFromRecord(raw: unknown): FreelanceData {
  const row = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const next = { ...DEFAULT_FREELANCE };
  for (const field of FREELANCE_FIELDS) {
    const value = readAlias(row, field.camel, field.snake);
    if (field.kind === "number") {
      next[field.camel] = finiteNumber(value, DEFAULT_FREELANCE[field.camel] as number) as never;
    } else if (field.kind === "boolean") {
      next[field.camel] = booleanValue(value, DEFAULT_FREELANCE[field.camel] as boolean) as never;
    } else if (typeof value === "string") {
      if (field.camel === "status") {
        if (value) next.status = value;
      } else {
        next[field.camel] = value as never;
      }
    }
  }
  return next;
}

function normalizeTask(raw: unknown, index: number): GanttTask | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const task = raw as Record<string, unknown>;
  if (typeof task.name !== "string" || !task.name.trim()) return null;
  const category = TASK_CATEGORIES.includes(task.category as GanttTask["category"])
    ? (task.category as GanttTask["category"])
    : "admin";
  return {
    id: typeof task.id === "string" && task.id ? task.id : `t-${index + 1}`,
    name: task.name.trim(),
    startMonth: finiteNumber(task.startMonth, 1),
    durationMonths: Math.max(1, finiteNumber(task.durationMonths, 1)),
    category,
    done: task.done === true,
  };
}

export function ganttFromRecord(raw: unknown): { tasks: GanttTask[] } {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { tasks: DEFAULT_TASKS.map((task) => ({ ...task })) };
  }
  const tasks = (raw as { tasks?: unknown }).tasks;
  if (tasks === undefined) return { tasks: DEFAULT_TASKS.map((task) => ({ ...task })) };
  if (!Array.isArray(tasks)) return { tasks: DEFAULT_TASKS.map((task) => ({ ...task })) };
  return { tasks: tasks.map(normalizeTask).filter((task): task is GanttTask => task !== null) };
}

export function cashFlowFromRecord(raw: unknown): CashFlowBackup {
  if (raw == null) return { ...EMPTY_CASH_FLOW, items: [] };
  return parseCashFlow(raw) ?? { ...EMPTY_CASH_FLOW, items: [] };
}

export function isCashFlowEmpty(cashFlow: CashFlowBackup): boolean {
  return cashFlow.items.length === 0 && cashFlow.initialBalance === 0;
}

export function withLocalCashFlowIfEmpty(
  server: EntrepriseState,
  localCash: CashFlowBackup | null
): { state: EntrepriseState; changed: boolean } {
  if (!localCash || isCashFlowEmpty(localCash) || !isCashFlowEmpty(server.cashFlow)) {
    return { state: server, changed: false };
  }
  return { state: { ...server, cashFlow: localCash }, changed: true };
}

function stateFromParts(source: Record<string, unknown>): EntrepriseState {
  return {
    freelance: freelanceFromRecord(source.freelance),
    gantt: ganttFromRecord(source.gantt),
    cashFlow: cashFlowFromRecord(source.cashFlow),
  };
}

export function stateFromBackup(backup: EntrepriseBackup): EntrepriseState {
  return {
    freelance: freelanceFromRecord(backup.freelance),
    gantt: ganttFromRecord(backup.gantt),
    cashFlow: backup.cashFlow ?? { ...EMPTY_CASH_FLOW, items: [] },
  };
}

export function normalizeEntreprise(raw: unknown): EntrepriseState {
  if (isEntrepriseBackup(raw)) {
    const parsed = parseEntrepriseBackup(raw);
    if ("error" in parsed) return defaultEntreprise();
    return stateFromBackup(parsed.backup);
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return defaultEntreprise();
  return stateFromParts(raw as Record<string, unknown>);
}

export function legacyEntrepriseRows(
  freelanceRow: Record<string, unknown> | null,
  ganttRow: Record<string, unknown> | null
): EntrepriseState | null {
  if (!freelanceRow && !ganttRow) return null;
  return normalizeEntreprise({
    freelance: freelanceRow ?? undefined,
    gantt: ganttRow ? { tasks: ganttRow.tasks } : undefined,
  });
}

export function toEntrepriseBackup(state: EntrepriseState, exportedAt = new Date().toISOString()): EntrepriseBackup {
  const freelance: Record<string, unknown> = {};
  for (const field of FREELANCE_FIELDS) {
    freelance[field.snake] = state.freelance[field.camel];
  }
  return {
    kind: ENTREPRISE_BACKUP_KIND,
    version: 1,
    exportedAt,
    cashFlow: {
      initialBalance: state.cashFlow.initialBalance,
      items: state.cashFlow.items.map((item) => ({ ...item })),
    },
    freelance,
    gantt: { tasks: state.gantt.tasks.map((task) => ({ ...task })) },
  };
}

export function cashFlowItems(items: CashFlowBackupItem[]): CashFlowBackupItem[] {
  return items.map((item) => ({ ...item }));
}
