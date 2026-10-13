export interface LoanSettings {
  capital: number;
  rate: number;
  durationMonths: number;
  monthlyPayment: number;
  startDate: string;
  insuranceMode: "capital" | "remaining";
  insuranceRate: number;
  insuranceAvgMonthly: number;
  guaranteeFees: number;
  brokerFees: number;
  fileFees: number;
}

export interface MonthDetail {
  month: number;
  payment: number;
  interest: number;
  principal: number;
  insurance: number;
  balance: number;
}

export interface LoanSummary {
  monthlyPayment: number;
  firstMonth: MonthDetail;
  remainingBalance: number;
  remainingMonths: number;
  elapsedMonths: number;
  totalInterest: number;
  totalInsurance: number;
  totalFees: number;
  totalCost: number;
  totalPaid: number;
  totalRemaining: number;
  taeg: number | null;
  progressPercent: number;
  endDate: string;
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

export function loanFees(loan: LoanSettings): number {
  return loan.guaranteeFees + loan.brokerFees + loan.fileFees;
}

export function buildSchedule(loan: LoanSettings): MonthDetail[] {
  const n = loan.durationMonths;
  const r = monthlyRate(loan.rate);
  const monthlyPayment =
    loan.monthlyPayment > 0
      ? loan.monthlyPayment
      : annuityPayment(loan.capital, loan.rate, n);

  const rows: MonthDetail[] = [];
  let balance = loan.capital;

  for (let m = 1; m <= n && balance > 0.005; m++) {
    const interest = balance * r;
    let principal = monthlyPayment - interest;
    if (m === n || principal > balance) principal = balance;
    const insurance =
      loan.insuranceMode === "remaining"
        ? balance * monthlyRate(loan.insuranceRate)
        : loan.insuranceAvgMonthly;
    balance = Math.max(0, balance - principal);
    rows.push({
      month: m,
      payment: principal + interest,
      interest,
      principal,
      insurance,
      balance,
    });
  }
  return rows;
}

export function insuranceForMonth(
  loan: LoanSettings,
  balance: number
): number {
  return loan.insuranceMode === "remaining"
    ? balance * monthlyRate(loan.insuranceRate)
    : loan.insuranceAvgMonthly;
}

function elapsedMonthsSince(startDate: string, today: Date): number {
  if (!startDate) return 0;
  const start = new Date(startDate + "-01");
  if (isNaN(start.getTime())) return 0;
  const diff =
    (today.getFullYear() - start.getFullYear()) * 12 +
    (today.getMonth() - start.getMonth());
  return Math.max(0, diff);
}

export function computeLoanSummary(
  loan: LoanSettings,
  today: Date = new Date()
): LoanSummary {
  const schedule = buildSchedule(loan);
  const n = schedule.length;
  const monthlyPayment = schedule[0]?.payment ?? 0;
  const elapsed = Math.min(
    n,
    elapsedMonthsSince(loan.startDate, today)
  );

  const totalInterest = schedule.reduce((a, m) => a + m.interest, 0);
  const totalInsurance = schedule.reduce((a, m) => a + m.insurance, 0);
  const fees = loanFees(loan);
  const totalCost = totalInterest + totalInsurance + fees;

  const remainingBalance = schedule[Math.max(0, elapsed - 1)]?.balance ?? loan.capital;
  const remainingSchedule = schedule.slice(elapsed);
  const totalRemaining = remainingSchedule.reduce(
    (a, m) => a + m.payment + m.insurance,
    0
  );


  return {
    monthlyPayment,
    firstMonth: schedule[0] ?? {
      month: 1,
      payment: 0,
      interest: 0,
      principal: 0,
      insurance: 0,
      balance: loan.capital,
    },
    remainingBalance,
    remainingMonths: n - elapsed,
    elapsedMonths: elapsed,
    totalInterest,
    totalInsurance,
    totalFees: fees,
    totalCost,
    totalPaid:
      schedule.slice(0, elapsed).reduce((a, m) => a + m.payment + m.insurance, 0) +
      fees,
    totalRemaining,
    taeg: computeTAEG(loan),
    progressPercent: n > 0 ? (elapsed / n) * 100 : 0,
    endDate: formatEndMonth(loan.startDate, n, today),
    ...{},
  };
}

function formatEndMonth(
  startDate: string,
  months: number,
  today: Date
): string {
  const remaining = computeRemainingFromStart(startDate, months, today);
  if (remaining <= 0) return "Terminé 🎉";
  const end = new Date(today.getFullYear(), today.getMonth() + remaining, 1);
  return end.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

function computeRemainingFromStart(
  startDate: string,
  months: number,
  today: Date
): number {
  const elapsed = elapsedMonthsSince(startDate, today);
  return Math.max(0, months - elapsed);
}

export function computeTAEG(loan: LoanSettings): number | null {
  const schedule = buildSchedule(loan);
  if (schedule.length === 0) return null;
  const fees = loanFees(loan);
  const funded = loan.capital + fees;

  const npv = (rateAnnual: number): number => {
    const r = rateAnnual / 12;
    if (r === 0) {
      const sum = schedule.reduce((a, m) => a + m.payment + m.insurance, 0);
      return funded - sum;
    }
    const pv = schedule.reduce(
      (a, m) => a + (m.payment + m.insurance) / Math.pow(1 + r, m.month),
      0
    );
    return funded - pv;
  };

  let low = 0.0001;
  let high = 1;
  for (let i = 0; i < 200; i++) {
    const mid = (low + high) / 2;
    const v = npv(mid);
    if (Math.abs(v) < 0.01) return mid * 100;
    if (v > 0) high = mid;
    else low = mid;
  }
  return ((low + high) / 2) * 100;
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
  remainingMonths: number,
  extraMonthly: number,
  today: Date = new Date()
): {
  rows: YearProjection[];
  payoffDate: Date | null;
  monthsToPayoff: number;
  interestSaved: number;
} {
  const r = monthlyRate(loan.rate);
  const rows: YearProjection[] = [];
  let balance = startBalance;
  let months = 0;
  let yearInterest = 0;
  let yearPrincipal = 0;
  let yearIns = 0;
  let payoffDate: Date | null = null;
  let baseInterestRemaining = 0;

  const baseSchedule = buildSchedule(loan);
  const elapsed = loan.durationMonths - remainingMonths;
  for (const m of baseSchedule.slice(Math.max(0, elapsed))) {
    baseInterestRemaining += m.interest;
  }

  let projectedInterest = 0;

  while (balance > 0.005 && months < 600) {
    const interest = balance * r;
    const monthlyBase = baseSchedule[Math.min(elapsed + months, baseSchedule.length - 1)];
    const basePayment = monthlyBase?.payment ?? 0;
    let principal = basePayment + extraMonthly - interest;
    if (principal > balance) principal = balance;
    if (principal <= 0) break;
    const insurance = insuranceForMonth(loan, balance);
    balance = Math.max(0, balance - principal);
    months++;
    projectedInterest += interest;
    yearInterest += interest;
    yearPrincipal += principal;
    yearIns += insurance;

    if (months % 12 === 0 || balance <= 0.005) {
      rows.push({
        year: Math.ceil((elapsed + months) / 12),
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
    if (balance <= 0.005) {
      payoffDate = new Date(today.getFullYear(), today.getMonth() + months, 1);
    }
  }

  return {
    rows,
    payoffDate,
    monthsToPayoff: months,
    interestSaved: Math.max(0, baseInterestRemaining - projectedInterest),
  };
}
