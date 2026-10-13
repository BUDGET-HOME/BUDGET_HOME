import type { BudgetState, Expense, Frequency, ImmoSettings, LoanSettings } from "./types";
import { DEFAULT_STATE } from "./types";

const STORAGE_KEY = "budget_couple_v9";

export function normalizeState(raw: unknown): BudgetState {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_STATE };
  const o = raw as Record<string, unknown>;
  const immoRaw = (o.immo ?? o) as Record<string, unknown>;
  const immo: ImmoSettings = {
    immoApport: num(immoRaw.immoApport, DEFAULT_STATE.immo.immoApport),
    immoRate: num(immoRaw.immoRate, DEFAULT_STATE.immo.immoRate),
    immoInsurance: num(immoRaw.immoInsurance, DEFAULT_STATE.immo.immoInsurance),
    immoDuration: num(immoRaw.immoDuration, DEFAULT_STATE.immo.immoDuration),
    immoType: immoRaw.immoType === "neuf" ? "neuf" : "ancien",
  };
  const loanRaw = (o.loan ?? {}) as Record<string, unknown>;
  const loan: LoanSettings = {
    capital: num(loanRaw.capital, 0),
    rate: num(loanRaw.rate, 3.4),
    durationMonths: num(loanRaw.durationMonths, 300),
    monthlyPayment: num(loanRaw.monthlyPayment, 0),
    startDate: typeof loanRaw.startDate === "string" ? loanRaw.startDate : "",
    insuranceMode: loanRaw.insuranceMode === "capital" ? "capital" : "remaining",
    insuranceRate: num(loanRaw.insuranceRate, 1.1),
    insuranceAvgMonthly: num(loanRaw.insuranceAvgMonthly, 0),
    guaranteeFees: num(loanRaw.guaranteeFees, 0),
    brokerFees: num(loanRaw.brokerFees, 0),
    fileFees: num(loanRaw.fileFees, 0),
  };
  const mode = o.mode === "commun" ? "commun" : "separe";
  const expenses: Expense[] = Array.isArray(o.expenses)
    ? o.expenses
        .filter((e): e is Record<string, unknown> => !!e && typeof e === "object")
        .map((e, i) => ({
          id: typeof e.id === "number" ? e.id : Date.now() + i,
          desc: String(e.desc ?? ""),
          amount: num(e.amount, 0),
          freq: (e.freq === "annual" ? "annual" : "monthly") as Frequency,
          category: String(e.category ?? "📦 Autre"),
          payer: (e.payer === "2" ? "2" : "1") as Expense["payer"],
        }))
        .filter((e) => e.desc && e.amount > 0)
    : [];
  return {
    name1: str(o.name1, DEFAULT_STATE.name1),
    name2: str(o.name2, DEFAULT_STATE.name2),
    salary1: str(o.salary1, ""),
    salary2: str(o.salary2, ""),
    force5050: o.force5050 === true,
    mode,
    expenses,
    immo,
    loan,
  };
}

function num(v: unknown, fallback: number): number {
  const n = typeof v === "string" ? parseFloat(v) : v;
  return typeof n === "number" && !isNaN(n) ? n : fallback;
}

function str(v: unknown, fallback: string): string {
  return typeof v === "string" && v ? v : fallback;
}

export function loadLocal(): BudgetState {
  if (typeof window === "undefined") return { ...DEFAULT_STATE };
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { ...DEFAULT_STATE };
  try {
    return normalizeState(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export function saveLocal(state: BudgetState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function exportJSON(state: BudgetState): void {
  const dataStr = JSON.stringify(state, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `budget_projet_immo_v9_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export type SyncStatus = "idle" | "saving" | "saved" | "error" | "offline";

export async function saveToServer(state: BudgetState): Promise<void> {
  const res = await fetch("/api/budget", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: state }),
  });
  if (!res.ok) {
    throw new Error(`save_failed_${res.status}`);
  }
}

export async function loadFromServer(): Promise<BudgetState | null> {
  const res = await fetch("/api/budget");
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(`load_failed_${res.status}`);
  const json = (await res.json()) as { budget?: { data?: unknown } | null };
  if (!json.budget?.data) return null;
  return normalizeState(json.budget.data);
}
