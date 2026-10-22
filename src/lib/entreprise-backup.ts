export const CASH_FLOW_STORAGE_KEY = "cashFlowData";
export const CASH_FLOW_AUTOSYNC_KEY = "cashFlowAutoSync";
export const ENTREPRISE_BACKUP_KIND = "budget-home-entreprise";

const CASH_FREQUENCIES = ["ponctuel", "mensuel", "trimestriel", "annuel"] as const;

const FREELANCE_FIELDS = [
  "status",
  "tjm",
  "days",
  "cost_retirement",
  "cost_lld",
  "cost_fuel",
  "cost_mutuelle",
  "cost_bank_ins",
  "cost_accountant",
  "pct_portage",
  "cost_meals",
  "cost_telecom",
  "cost_tech",
  "acre",
  "fiscal_parts",
  "are_toggle",
  "salary_gross",
  "salary_bonus",
  "salary_months",
  "user_age",
  "use_spouse_mutuelle",
  "activity_start_date",
  "contract_end_date",
  "are_worked_days",
  "are_inactivity_days",
  "are_excluded_days",
  "are_part_time",
  "are_paid_leave",
  "are_severance",
  "are_rights_used",
  "are_overseas",
  "are_individual_agreement",
  "are_reduced_minimum",
  "are_economic_layoff",
  "are_waiting_served",
  "arce_second_payment",
  "tva_rate",
] as const;

const GANTT_FIELDS = ["tasks"] as const;

export interface CashFlowBackupItem {
  id: string;
  label: string;
  amount: number;
  type: "credit" | "debit";
  frequency: (typeof CASH_FREQUENCIES)[number];
  startDate: string;
  endDate: string | null;
  category: string;
  notes: string;
}

export interface CashFlowBackup {
  items: CashFlowBackupItem[];
  initialBalance: number;
}

export interface EntrepriseBackup {
  kind: typeof ENTREPRISE_BACKUP_KIND;
  version: 1;
  exportedAt: string;
  cashFlow: CashFlowBackup | null;
  freelance: Record<string, unknown> | null;
  gantt: Record<string, unknown> | null;
}

export function isEntrepriseBackup(raw: unknown): boolean {
  return (
    !!raw &&
    typeof raw === "object" &&
    !Array.isArray(raw) &&
    (raw as { kind?: unknown }).kind === ENTREPRISE_BACKUP_KIND
  );
}

export function parseCashFlow(raw: unknown): CashFlowBackup | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const source = raw as Record<string, unknown>;
  if (!Array.isArray(source.items)) return null;
  if (typeof source.initialBalance !== "number" || !Number.isFinite(source.initialBalance)) {
    return null;
  }

  const items: CashFlowBackupItem[] = [];
  for (const entry of source.items) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
    const item = entry as Record<string, unknown>;
    if (typeof item.label !== "string" || !item.label.trim()) return null;
    if (typeof item.amount !== "number" || !Number.isFinite(item.amount)) return null;
    if (item.type !== "credit" && item.type !== "debit") return null;
    if (!CASH_FREQUENCIES.includes(item.frequency as CashFlowBackupItem["frequency"])) return null;
    if (typeof item.startDate !== "string" || !item.startDate) return null;
    items.push({
      id: typeof item.id === "string" && item.id ? item.id : `cf-${items.length + 1}`,
      label: item.label.trim(),
      amount: item.amount,
      type: item.type,
      frequency: item.frequency as CashFlowBackupItem["frequency"],
      startDate: item.startDate,
      endDate: typeof item.endDate === "string" ? item.endDate : null,
      category: typeof item.category === "string" ? item.category : "",
      notes: typeof item.notes === "string" ? item.notes : "",
    });
  }

  return { items, initialBalance: source.initialBalance };
}

export function pickFields(
  row: Record<string, unknown>,
  fields: readonly string[]
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  for (const field of fields) {
    if (row[field] !== undefined) payload[field] = row[field];
  }
  return payload;
}

export function parseEntrepriseBackup(
  raw: unknown
): { backup: EntrepriseBackup } | { error: string } {
  if (!isEntrepriseBackup(raw)) {
    return { error: "Ce fichier n'est pas une sauvegarde Entreprise." };
  }
  const source = raw as Record<string, unknown>;
  if (source.version !== 1) {
    return { error: "Version de fichier non prise en charge." };
  }

  const cashFlow = source.cashFlow == null ? null : parseCashFlow(source.cashFlow);
  if (source.cashFlow != null && !cashFlow) {
    return { error: "La trésorerie de ce fichier est illisible." };
  }

  const freelance = readRow(source.freelance);
  if (freelance === false) {
    return { error: "Le simulateur freelance de ce fichier est illisible." };
  }
  const gantt = readRow(source.gantt);
  if (gantt === false) {
    return { error: "Le planning de ce fichier est illisible." };
  }
  if (gantt && gantt.tasks !== undefined && !Array.isArray(gantt.tasks)) {
    return { error: "Le planning de ce fichier est illisible." };
  }

  return {
    backup: {
      kind: ENTREPRISE_BACKUP_KIND,
      version: 1,
      exportedAt:
        typeof source.exportedAt === "string"
          ? source.exportedAt
          : new Date().toISOString(),
      cashFlow,
      freelance: freelance ? pickFields(freelance, FREELANCE_FIELDS) : null,
      gantt: gantt ? pickFields(gantt, GANTT_FIELDS) : null,
    },
  };
}

function readRow(raw: unknown): Record<string, unknown> | null | false {
  if (raw == null) return null;
  if (typeof raw !== "object" || Array.isArray(raw)) return false;
  return raw as Record<string, unknown>;
}

export function readStoredCashFlow(): unknown {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(CASH_FLOW_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

export function writeStoredCashFlow(data: CashFlowBackup): void {
  localStorage.setItem(CASH_FLOW_STORAGE_KEY, JSON.stringify(data));
  localStorage.setItem(CASH_FLOW_AUTOSYNC_KEY, "0");
}
