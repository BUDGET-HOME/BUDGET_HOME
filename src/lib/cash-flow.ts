export type CashFlowFrequency = "ponctuel" | "mensuel" | "trimestriel" | "annuel";

export interface CashFlowProjectionItem {
  amount: number;
  type: "credit" | "debit";
  frequency: CashFlowFrequency;
  startDate: string;
  endDate: string | null;
}

export interface MonthCashFlow {
  label: string;
  credits: number;
  debits: number;
  balance: number;
}

function parseLocalDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

function monthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, count: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + count, 1);
}

function monthDelta(later: Date, earlier: Date): number {
  return (later.getFullYear() - earlier.getFullYear()) * 12 + (later.getMonth() - earlier.getMonth());
}

export function occursInMonth(item: CashFlowProjectionItem, month: Date): boolean {
  const start = monthStart(parseLocalDate(item.startDate));
  if (month < start) return false;
  if (item.endDate) {
    const end = monthStart(parseLocalDate(item.endDate));
    if (month > end) return false;
  }
  const delta = monthDelta(month, start);
  if (item.frequency === "ponctuel") return delta === 0;
  if (item.frequency === "mensuel") return true;
  if (item.frequency === "trimestriel") return delta % 3 === 0;
  if (item.frequency === "annuel") return delta % 12 === 0;
  return false;
}

export function projectCashFlow(
  items: CashFlowProjectionItem[],
  openingBalance: number,
  now = new Date(),
  monthCount = 12,
  extraCredits: number[] = [],
): MonthCashFlow[] {
  const horizon = monthStart(now);
  let balance = openingBalance;
  const rows: MonthCashFlow[] = [];
  for (let index = 0; index < monthCount; index += 1) {
    const month = addMonths(horizon, index);
    let credits = extraCredits[index] ?? 0;
    let debits = 0;
    for (const item of items) {
      if (!occursInMonth(item, month)) continue;
      if (item.type === "credit") credits += item.amount;
      else debits += item.amount;
    }
    balance += credits - debits;
    rows.push({
      label: month.toLocaleString("fr-FR", { month: "short", year: "numeric" }),
      credits,
      debits,
      balance,
    });
  }
  return rows;
}

/** Le chiffre d'affaires du premier mois n'est pas de la trésorerie déjà encaissée. */
export function openingBalanceWithoutFirstRevenue(previous: number, monthlyRevenue: number): number {
  if (monthlyRevenue > 0 && previous === monthlyRevenue) return 0;
  return previous;
}
