export interface AreInput {
  monthlyGross: number;
  annualBonus: number;
  /** Nombre de mois de paie dans l'année (12, 13, 13,5 ou 14). */
  payMonths: number;
  /** Âge à la fin du dernier contrat. */
  age: number;
  /** Jours travaillés sur la période de référence. 730 couvre 24 mois et le plafond de 18 mois. */
  workedDays: number;
  inactivityDays: number;
  excludedDays: number;
  /** 100 = temps plein. Réduit la partie fixe et l'allocation minimale. */
  partTimePercent: number;
  overseas: boolean;
  /** Rupture conventionnelle individuelle à compter du 01/09/2026. */
  individualAgreement: boolean;
  /** 5 mois au lieu de 6 (saisonnier ou première ouverture depuis 20 ans). */
  reducedMinimum: boolean;
  paidLeaveIndemnity: number;
  severanceAboveLegal: number;
  economicLayoff: boolean;
  waitingServed: boolean;
  rightsUsedDays: number;
}

export interface AreEstimate {
  eligible: boolean;
  reason: string;
  sjr: number;
  dailyGross: number;
  /** Allocation journalière nette (retraite complémentaire, et CSG/CRDS au taux plein). */
  daily: number;
  monthly: number;
  durationDays: number;
  durationMonths: number;
  retainedDays: number;
  degressive: boolean;
  remainingDays: number;
  remainingNet: number;
  deferSeveranceDays: number;
  deferLeaveDays: number;
  waitingDays: number;
  referenceSalary: number;
}

export interface ArceOptions {
  contractEndDate?: string;
  secondPayment?: boolean;
  microWithoutAcre?: boolean;
}

export interface ArcePlan {
  /** Somme effectivement versée (une ou deux moitiés). */
  total: number;
  /** Capital théorique, avant abandon éventuel du second versement. */
  capital: number;
  first: number;
  second: number;
  rate: number;
  blockedReason: string;
  firstMonthIndex: number;
  secondMonthIndex: number;
}

const FIXED_PART = 13.18;
const MINIMUM_DAILY = 32.13;
const DEGRESSIVITY_SJR = 162.4;
const DEGRESSIVITY_FLOOR = 92.57;
const CSG_SALARY = 3677.98;
const RETIREMENT_SALARY = 1303.05;
const CSG_RATE = 0.067 * 0.9825;
const DAYS_PER_YEAR = 365;
const DAYS_PER_MONTH = 30.42;
const MONTHLY_SALARY_CAP = 16020;
const SJR_CAP = (MONTHLY_SALARY_CAP * 12) / DAYS_PER_YEAR;

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function netDaily(gross: number, monthlyReference: number): number {
  let net = gross;
  if (monthlyReference >= RETIREMENT_SALARY) net -= gross * 0.03;
  if (monthlyReference >= CSG_SALARY) net -= gross * CSG_RATE;
  return Math.max(0, net);
}

/** Plafond en jours, France Travail, septembre 2026. */
export function maxIndemnisationDays(age: number, overseas: boolean, individualAgreement: boolean): number {
  const senior = age >= 57 ? "57" : age >= 55 ? "55" : "young";
  if (individualAgreement) {
    if (overseas) return senior === "young" ? 608 : senior === "55" ? 913 : 1095;
    return senior === "young" ? 456 : senior === "55" ? 624 : 822;
  }
  if (overseas) return senior === "young" ? 730 : senior === "55" ? 913 : 1095;
  return senior === "young" ? 548 : senior === "55" ? 685 : 822;
}

export function arceRate(contractEndDate = ""): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(contractEndDate.trim());
  if (!match) return 0.6;
  const end = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (Number.isNaN(end.getTime())) return 0.6;
  return end < new Date(2023, 6, 1) ? 0.45 : 0.6;
}

function emptyEstimate(reason: string, partial: Partial<AreEstimate> = {}): AreEstimate {
  return {
    eligible: false,
    reason,
    sjr: 0,
    dailyGross: 0,
    daily: 0,
    monthly: 0,
    durationDays: 0,
    durationMonths: 0,
    retainedDays: 0,
    degressive: false,
    remainingDays: 0,
    remainingNet: 0,
    deferSeveranceDays: 0,
    deferLeaveDays: 0,
    waitingDays: 0,
    referenceSalary: 0,
    ...partial,
  };
}

export function estimateAre(input: AreInput): AreEstimate {
  const workedDays = Math.max(0, input.workedDays);
  const countedInactivity = Math.min(Math.max(0, input.inactivityDays), workedDays * 0.7);
  const retainedDays = Math.max(0, workedDays + countedInactivity - Math.max(0, input.excludedDays));
  const monthlyGross = Math.min(Math.max(0, input.monthlyGross), MONTHLY_SALARY_CAP);
  const payMonths = input.payMonths > 0 ? input.payMonths : 12;
  const referenceSalary = (monthlyGross * payMonths * workedDays) / DAYS_PER_YEAR + Math.max(0, input.annualBonus);
  const sjr = Math.min(SJR_CAP, retainedDays > 0 ? referenceSalary / retainedDays : 0);
  const ratio = input.partTimePercent > 0 && input.partTimePercent < 100 ? input.partTimePercent / 100 : 1;
  const monthlyReference = sjr * DAYS_PER_MONTH;

  const formulaFixed = sjr * 0.404 + FIXED_PART * ratio;
  const formulaPercent = sjr * 0.57;
  let dailyGross = Math.max(formulaFixed, formulaPercent);
  dailyGross = Math.max(dailyGross, MINIMUM_DAILY * ratio);
  dailyGross = Math.min(dailyGross, sjr * 0.75);

  const reducedGross = Math.min(dailyGross, Math.max(dailyGross * 0.7, DEGRESSIVITY_FLOOR));
  const degressive = input.age < 55 && sjr > DEGRESSIVITY_SJR;
  const daily = netDaily(dailyGross, monthlyReference);
  const deferSeveranceDays = Math.min(
    input.economicLayoff ? 75 : 150,
    input.severanceAboveLegal > 0 ? input.severanceAboveLegal / 111.8 : 0,
  );
  const deferLeaveDays = sjr > 0 ? Math.min(30, Math.max(0, input.paidLeaveIndemnity) / sjr) : 0;
  const waitingDays = input.waitingServed ? 0 : 7;

  if (workedDays < 130 || retainedDays <= 0) {
    return emptyEstimate("Il faut au moins 130 jours travaillés sur la période de référence.", {
      sjr,
      retainedDays,
      referenceSalary,
      deferSeveranceDays,
      deferLeaveDays,
      waitingDays,
    });
  }

  const coefficient = input.overseas ? 1 : 0.75;
  const minimumDays = input.reducedMinimum ? 152 : 182;
  const durationDays = Math.min(
    maxIndemnisationDays(input.age, input.overseas, input.individualAgreement),
    Math.max(minimumDays, Math.round(retainedDays * coefficient)),
  );
  const rightsUsed = Math.max(0, input.rightsUsedDays);
  const remainingDays = Math.max(0, durationDays - rightsUsed);
  const fullDaysLeft = degressive ? Math.max(0, 182 - rightsUsed) : remainingDays;
  const fullDays = Math.min(remainingDays, fullDaysLeft);
  const reducedDays = remainingDays - fullDays;
  const remainingNet = fullDays * daily + reducedDays * netDaily(degressive ? reducedGross : dailyGross, monthlyReference);

  return {
    eligible: true,
    reason: "",
    sjr,
    dailyGross,
    daily,
    monthly: daily * DAYS_PER_MONTH,
    durationDays,
    durationMonths: round1(durationDays / DAYS_PER_MONTH),
    retainedDays,
    degressive,
    remainingDays,
    remainingNet,
    deferSeveranceDays,
    deferLeaveDays,
    waitingDays,
    referenceSalary,
  };
}

/** Ancien appel : 24 mois d'affiliation, assez pour le plafond d'un salarié de moins de 55 ans. */
export function calculateARE(
  monthlyGross: number,
  annualBonus: number,
  age: number,
  monthsCount: number,
): AreEstimate {
  return estimateAre({
    monthlyGross,
    annualBonus,
    payMonths: monthsCount,
    age,
    workedDays: 730,
    inactivityDays: 0,
    excludedDays: 0,
    partTimePercent: 100,
    overseas: false,
    individualAgreement: false,
    reducedMinimum: false,
    paidLeaveIndemnity: 0,
    severanceAboveLegal: 0,
    economicLayoff: false,
    waitingServed: true,
    rightsUsedDays: 0,
  });
}

function blockedPlan(reason: string, rate: number): ArcePlan {
  return {
    total: 0,
    capital: 0,
    first: 0,
    second: 0,
    rate,
    blockedReason: reason,
    firstMonthIndex: 0,
    secondMonthIndex: 6,
  };
}

export function arceFromAre(are: AreEstimate, options: ArceOptions = {}): ArcePlan {
  const rate = arceRate(options.contractEndDate ?? "");
  if (!are.eligible) return blockedPlan(are.reason, rate);
  if (options.microWithoutAcre) {
    return blockedPlan("Un micro-entrepreneur doit avoir l'ACRE pour percevoir l'ARCE.", rate);
  }
  const capital = Math.round(Math.max(0, are.remainingNet) * rate);
  const first = Math.round(capital / 2);
  const second = options.secondPayment === false ? 0 : capital - first;
  return {
    total: first + second,
    capital,
    first,
    second,
    rate,
    blockedReason: "",
    firstMonthIndex: 0,
    secondMonthIndex: 6,
  };
}

export function arceCreditsByMonth(plan: ArcePlan, monthCount = 12): number[] {
  const credits = Array.from({ length: monthCount }, () => 0);
  if (plan.total <= 0) return credits;
  if (plan.firstMonthIndex < monthCount) credits[plan.firstMonthIndex] = plan.first;
  if (plan.secondMonthIndex < monthCount) credits[plan.secondMonthIndex] = plan.second;
  return credits;
}

export function areInputFromFreelance(data: {
  salaryGross?: number;
  salaryBonus?: number;
  salaryMonths?: number;
  userAge?: number;
  areWorkedDays?: number;
  areInactivityDays?: number;
  areExcludedDays?: number;
  arePartTime?: number;
  areOverseas?: boolean;
  areIndividualAgreement?: boolean;
  areReducedMinimum?: boolean;
  arePaidLeave?: number;
  areSeverance?: number;
  areEconomicLayoff?: boolean;
  areWaitingServed?: boolean;
  areRightsUsed?: number;
}): AreInput {
  return {
    monthlyGross: data.salaryGross ?? 3500,
    annualBonus: data.salaryBonus ?? 0,
    payMonths: data.salaryMonths ?? 12,
    age: data.userAge ?? 35,
    workedDays: data.areWorkedDays ?? 730,
    inactivityDays: data.areInactivityDays ?? 0,
    excludedDays: data.areExcludedDays ?? 0,
    partTimePercent: data.arePartTime ?? 100,
    overseas: data.areOverseas ?? false,
    individualAgreement: data.areIndividualAgreement ?? false,
    reducedMinimum: data.areReducedMinimum ?? false,
    paidLeaveIndemnity: data.arePaidLeave ?? 0,
    severanceAboveLegal: data.areSeverance ?? 0,
    economicLayoff: data.areEconomicLayoff ?? false,
    waitingServed: data.areWaitingServed ?? false,
    rightsUsedDays: data.areRightsUsed ?? 0,
  };
}
