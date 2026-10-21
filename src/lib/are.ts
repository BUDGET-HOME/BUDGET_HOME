export interface AreEstimate {
  daily: number;
  monthly: number;
  durationMonths: number;
}

export interface ArcePlan {
  total: number;
  first: number;
  second: number;
  /** Mois du planning (0 = fin du mois 1, 6 = six mois plus tard). */
  firstMonthIndex: number;
  secondMonthIndex: number;
}

/** Même calcul que le simulateur freelance (allocation journalière nette et durée selon l'âge). */
export function calculateARE(
  monthlyGross: number,
  annualBonus: number,
  age: number,
  monthsCount: number,
): AreEstimate {
  const annualTotal = monthlyGross * monthsCount + annualBonus;
  const sjr = annualTotal / 365;
  const formula1 = sjr * 0.404 + 13.11;
  const formula2 = sjr * 0.57;
  let areBrut = Math.max(formula1, formula2);
  areBrut = Math.min(areBrut, sjr * 0.75);
  areBrut = Math.max(areBrut, 31.97);
  const daily = areBrut * 0.97;
  let durationMonths = 18;
  if (age >= 53 && age < 55) durationMonths = 22.5;
  if (age >= 55) durationMonths = 27;
  return { daily, monthly: daily * 30.42, durationMonths };
}

/** ARCE = 45 % des droits ARE restants, versée en deux fois égales. */
export function arceFromAre(are: AreEstimate): ArcePlan {
  const rights = are.monthly * are.durationMonths;
  const total = Math.round(rights * 0.45);
  const first = Math.round(total / 2);
  const second = total - first;
  return { total, first, second, firstMonthIndex: 0, secondMonthIndex: 6 };
}

export function arceCreditsByMonth(plan: ArcePlan, monthCount = 12): number[] {
  const credits = Array.from({ length: monthCount }, () => 0);
  if (plan.total <= 0) return credits;
  if (plan.firstMonthIndex < monthCount) credits[plan.firstMonthIndex] = plan.first;
  if (plan.secondMonthIndex < monthCount) credits[plan.secondMonthIndex] = plan.second;
  return credits;
}
