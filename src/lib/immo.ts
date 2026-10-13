import { summarizeExpenses } from "./budget";
import type { Expense } from "./types";

export interface ImmoInput {
  salary1: number;
  salary2: number;
  expenses: Expense[];
  force5050: boolean;
  apport: number;
  ratePercent: number;
  insurancePercent: number;
  durationYears: number;
  type: "ancien" | "neuf";
}

export interface ImmoResult {
  maxMonthlyBank: number;
  maxMonthlyReal: number;
  safeMonthlyPayment: number;
  monthlyInsuranceCost: number;
  loanAmount: number;
  totalInsuranceCost: number;
  totalCreditInterest: number;
  totalCreditCost: number;
  totalProject: number;
  notaryRate: number;
  notaryFees: number;
  netSellerPrice: number;
  limitedByRestToLive: boolean;
  currentAnnualRent: number;
}

export function calculateImmo(input: ImmoInput): ImmoResult {
  const totalIncomeMonth = input.salary1 + input.salary2;
  const summary = summarizeExpenses(input.expenses);
  const annualSummary = summary.totalAnnual;
  const rent = summary.currentAnnualRent;

  const maxMonthlyBank = totalIncomeMonth * 0.35;
  const expensesWithoutRentMonthly = (annualSummary - rent) / 12;
  const maxMonthlyReal = totalIncomeMonth - expensesWithoutRentMonthly;
  const safeMonthlyPayment = Math.min(maxMonthlyBank, maxMonthlyReal);

  const r = (input.ratePercent / 100) / 12;
  const n = input.durationYears * 12;
  const insFactor = (input.insurancePercent / 100) / 12;

  let factor: number;
  if (r > 0) {
    factor = r / (1 - Math.pow(1 + r, -n)) + insFactor;
  } else {
    factor = 1 / n + insFactor;
  }

  const loanAmount = factor > 0 ? safeMonthlyPayment / factor : 0;
  const monthlyInsuranceCost = loanAmount * insFactor;
  const totalInsuranceCost = monthlyInsuranceCost * n;
  const totalCreditInterest = safeMonthlyPayment * n - loanAmount - totalInsuranceCost;
  const totalCreditCost = totalCreditInterest + totalInsuranceCost;
  const totalProject = loanAmount + input.apport;

  const notaryRate = input.type === "ancien" ? 0.08 : 0.025;
  const netSellerPrice = totalProject / (1 + notaryRate);
  const notaryFees = totalProject - netSellerPrice;

  return {
    maxMonthlyBank,
    maxMonthlyReal,
    safeMonthlyPayment,
    monthlyInsuranceCost,
    loanAmount,
    totalInsuranceCost,
    totalCreditInterest,
    totalCreditCost,
    totalProject,
    notaryRate,
    notaryFees,
    netSellerPrice,
    limitedByRestToLive: maxMonthlyReal < maxMonthlyBank,
    currentAnnualRent: rent,
  };
}

export interface AmortizationYear {
  year: number;
  balance: number;
  interest: number;
  principal: number;
  insurance: number;
  total: number;
}

export function generateAmortization(
  principal: number,
  rateMonthly: number,
  months: number,
  monthlyIns: number
): AmortizationYear[] {
  const rows: AmortizationYear[] = [];
  let balance = principal;
  let yearInterest = 0;
  let yearPrincipal = 0;
  let yearIns = 0;

  for (let i = 1; i <= months; i++) {
    const interest = balance * rateMonthly;
    const paymentPart =
      (principal * rateMonthly) / (1 - Math.pow(1 + rateMonthly, -months));
    const principalPart = paymentPart - interest;

    balance -= principalPart;
    if (balance < 0) balance = 0;

    yearInterest += interest;
    yearPrincipal += principalPart;
    yearIns += monthlyIns;

    if (i % 12 === 0 || i === months) {
      rows.push({
        year: Math.ceil(i / 12),
        balance,
        interest: yearInterest,
        principal: yearPrincipal,
        insurance: yearIns,
        total: yearInterest + yearPrincipal + yearIns,
      });
      yearInterest = 0;
      yearPrincipal = 0;
      yearIns = 0;
    }
  }
  return rows;
}

export function monthsToSave(apport: number, monthlySavings: number): number | null {
  if (monthlySavings <= 0 || apport <= 0) return null;
  return apport / monthlySavings;
}
