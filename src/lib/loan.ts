import type { LoanSettings } from "./types";

export interface LoanSummary {
  monthlyInsurance: number;
  monthlyInterest: number;
  monthlyPrincipal: number;
  remainingMonths: number;
  remainingBalance: number;
  totalRemainingCost: number;
  totalPaid: number;
  totalCost: number;
  progressPercent: number;
  endDate: string;
  payoffMonthsSaved: number;
  interestSaved: number;
}

export function monthlyRate(ratePercent: number): number {
  return ratePercent / 100 / 12;
}

export function annuityPayment(
  capital: number,
  ratePercent: number,
  months: number
): number {
  const r = monthlyRate(ratePercent);
  if (months <= 0) return 0;
  if (r === 0) return capital / months;
  return (capital * r) / (1 - Math.pow(1 + r, -months));
}

export function computeLoanSummary(
  loan: LoanSettings,
  today: Date = new Date()
): LoanSummary {
  const n = loan.durationMonths;
  const r = monthlyRate(loan.rate);
  const ins = monthlyRate(loan.insuranceRate);
  const monthlyInsurance = loan.capital * ins;
  const monthlyPayment =
    loan.monthlyPayment > 0
      ? loan.monthlyPayment
      : annuityPayment(loan.capital, loan.rate, n);
  const monthlyInterest = loan.capital * r;
  const monthlyPrincipal = monthlyPayment - monthlyInterest;

  const start = loan.startDate ? new Date(loan.startDate) : null;
  const elapsedMonths = start
    ? Math.max(
        0,
        Math.min(
          n,
          (today.getFullYear() - start.getFullYear()) * 12 +
            (today.getMonth() - start.getMonth())
        )
      )
    : 0;

  let balance = loan.capital;
  for (let i = 0; i < elapsedMonths; i++) {
    const interest = balance * r;
    const principal = monthlyPayment - interest;
    balance = Math.max(0, balance - principal);
  }

  const remainingMonths = Math.max(0, n - elapsedMonths);
  const totalInsuranceCost = monthlyInsurance * n;
  const totalInterestCost =
    monthlyPayment * n - loan.capital - totalInsuranceCost;
  const totalCost = totalInterestCost + totalInsuranceCost;
  const totalRemainingCost =
    monthlyPayment * remainingMonths - balance + monthlyInsurance * remainingMonths;

  const payoffMonthsSaved = remainingMonths;
  const interestSaved = remainingMonths > 0
    ? monthlyPayment * remainingMonths - balance
    : 0;

  const end = new Date(today.getFullYear(), today.getMonth() + remainingMonths, 1);
  const endDate = remainingMonths === 0
    ? "Terminé 🎉"
    : end.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  return {
    monthlyInsurance,
    monthlyInterest,
    monthlyPrincipal,
    remainingMonths,
    remainingBalance: balance,
    totalRemainingCost,
    totalPaid: elapsedMonths * (monthlyPayment + monthlyInsurance),
    totalCost,
    progressPercent: n > 0 ? (elapsedMonths / n) * 100 : 0,
    endDate,
    payoffMonthsSaved,
    interestSaved,
  };
}

export interface YearProjection {
  year: number;
  balance: number;
  interest: number;
  principal: number;
  insurance: number;
  total: number;
}

export function projectLoan(
  loan: LoanSettings,
  startBalance: number,
  startMonthIndex: number,
  extraMonthly: number,
  today: Date = new Date()
): { rows: YearProjection[]; payoffDate: Date | null; monthsToPayoff: number } {
  const r = monthlyRate(loan.rate);
  const ins = monthlyRate(loan.insuranceRate);
  const monthlyInsurance = startBalance * ins;
  const monthlyPayment =
    loan.monthlyPayment > 0
      ? loan.monthlyPayment
      : annuityPayment(loan.capital, loan.rate, loan.durationMonths);

  const rows: YearProjection[] = [];
  let balance = startBalance;
  let months = 0;
  let yearInterest = 0;
  let yearPrincipal = 0;
  let yearIns = 0;
  let payoffDate: Date | null = null;

  while (balance > 0 && months < 600) {
    const interest = balance * r;
    const principal = Math.min(balance, monthlyPayment + extraMonthly - interest);
    if (principal <= 0) break;
    balance = Math.max(0, balance - principal);
    months++;
    yearInterest += interest;
    yearPrincipal += principal;
    yearIns += monthlyInsurance;

    if (months % 12 === 0 || balance === 0) {
      rows.push({
        year: Math.ceil((startMonthIndex + months) / 12),
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
    if (balance === 0) {
      payoffDate = new Date(
        today.getFullYear(),
        today.getMonth() + months,
        1
      );
    }
  }

  return { rows, payoffDate, monthsToPayoff: months };
}
