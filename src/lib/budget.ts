import { RENT_CATEGORY, type BudgetMode, type Expense } from "./types";
import { buildSchedule, computeLoanSummary, type LoanPayer, type LoanSettings } from "./loan";

export interface RatioResult {
  ratio1: number;
  ratio2: number;
  forced: boolean;
}

export function computeRatio(
  salary1: number,
  salary2: number,
  force5050: boolean,
  mode: BudgetMode = "separe"
): RatioResult {
  const total = salary1 + salary2;
  const forced = mode === "commun" || force5050 || total <= 0;
  const ratio1 = forced ? 0.5 : salary1 / total;
  return { ratio1, ratio2: 1 - ratio1, forced };
}

export function annualAmount(exp: Expense): number {
  return exp.freq === "monthly" ? exp.amount * 12 : exp.amount;
}

export interface BudgetSummary {
  totalAnnual: number;
  paidAnnual1: number;
  paidAnnual2: number;
  categoryTotals: Record<string, number>;
  currentAnnualRent: number;
}

export function summarizeExpenses(expenses: Expense[]): BudgetSummary {
  const summary: BudgetSummary = {
    totalAnnual: 0,
    paidAnnual1: 0,
    paidAnnual2: 0,
    categoryTotals: {},
    currentAnnualRent: 0,
  };
  for (const exp of expenses) {
    const annual = annualAmount(exp);
    summary.totalAnnual += annual;
    if (exp.payer === "1") summary.paidAnnual1 += annual;
    else summary.paidAnnual2 += annual;
    summary.categoryTotals[exp.category] =
      (summary.categoryTotals[exp.category] ?? 0) + annual;
    if (exp.category === RENT_CATEGORY) summary.currentAnnualRent += annual;
  }
  return summary;
}

export type ViewMode = "monthly" | "annual";

export interface BalanceResult {
  displayTotal: number;
  displayIncome: number;
  displayPaid1: number;
  displayPaid2: number;
  savingsCapacity: number;
  shouldPay1: number;
  balance1: number;
}

export function loanPeriodAmount(
  loan: LoanSettings,
  viewMode: ViewMode,
  today: Date = new Date()
): number {
  if (loan.capital <= 0) return 0;
  const summary = computeLoanSummary(loan, today);
  if (summary.remainingMonths <= 0) return 0;
  const upcoming = buildSchedule(loan).slice(summary.elapsedMonths);
  const months = viewMode === "monthly" ? upcoming.slice(0, 1) : upcoming.slice(0, 12);
  return months.reduce((sum, month) => sum + month.payment + month.insurance, 0);
}

export function splitLoanPayment(
  amount: number,
  payer: LoanPayer = "shared"
): { paid1: number; paid2: number } {
  if (payer === "1") return { paid1: amount, paid2: 0 };
  if (payer === "2") return { paid1: 0, paid2: amount };
  return { paid1: amount / 2, paid2: amount / 2 };
}

export function computeBalance(
  salary1: number,
  salary2: number,
  expenses: Expense[],
  viewMode: ViewMode,
  force5050: boolean,
  mode: BudgetMode = "separe",
  loan?: LoanSettings
): BalanceResult {
  const { ratio1 } = computeRatio(salary1, salary2, force5050, mode);
  const s = summarizeExpenses(expenses);
  const factor = viewMode === "monthly" ? 12 : 1;
  const loanAmount = loan ? loanPeriodAmount(loan, viewMode) : 0;
  const loanPaid = splitLoanPayment(loanAmount, loan?.loanPayer);
  const displayTotal = s.totalAnnual / factor + loanAmount;
  const displayIncome = ((salary1 + salary2) * 12) / factor;
  const displayPaid1 = s.paidAnnual1 / factor + loanPaid.paid1;
  const displayPaid2 = s.paidAnnual2 / factor + loanPaid.paid2;
  const shouldPay1 = displayTotal * ratio1;
  return {
    displayTotal,
    displayIncome,
    displayPaid1,
    displayPaid2,
    savingsCapacity: displayIncome - displayTotal,
    shouldPay1,
    balance1: displayPaid1 - shouldPay1,
  };
}

export interface Verdict {
  status: "empty" | "balanced" | "debt";
  debtor: string;
  creditor: string;
  amount: number;
}

export function computeVerdict(
  balance1: number,
  totalAnnual: number,
  name1: string,
  name2: string
): Verdict {
  if (totalAnnual === 0) {
    return { status: "empty", debtor: "", creditor: "", amount: 0 };
  }
  if (Math.abs(balance1) < 1) {
    return { status: "balanced", debtor: "", creditor: "", amount: 0 };
  }
  const debtor = balance1 > 0 ? name2 : name1;
  const creditor = balance1 > 0 ? name1 : name2;
  return { status: "debt", debtor, creditor, amount: Math.abs(balance1) };
}

export function formatEUR(value: number, digits = 0): string {
  return value.toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: digits,
  });
}
