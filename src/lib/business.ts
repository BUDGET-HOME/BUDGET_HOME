import type { CompanyStatus } from "./launch";

export interface ServiceLine {
  id: number;
  name: string;
  unitPrice: number;
  unitsPerMonth: number;
}

export interface RevenueSimInput {
  status: CompanyStatus;
  services: ServiceLine[];
  annualRevenue: number;
  monthlyBusinessExpense: number;
}

export interface YearlyResult {
  status: CompanyStatus;
  label: string;
  socialContributions: number;
  tax: number;
  netIncome: number;
  dividendTax: number;
  totalTakeHome: number;
  effectiveRate: number;
  eligible: boolean;
  eligibilityNote: string;
}

export function socialContributions(
  status: CompanyStatus,
  revenue: number,
  expense: number
): number {
  if (status === "micro" || status === "ei") {
    const base = status === "micro" ? revenue * 0.5 : Math.max(0, revenue - expense);
    return base * 0.45;
  }
  return 0;
}

export function corporateTax(revenue: number, expense: number, salary: number): number {
  const profit = Math.max(0, revenue - expense - salary);
  return profit * 0.15;
}

export function simulateYear(input: RevenueSimInput): YearlyResult[] {
  const rev = input.annualRevenue;
  const exp = input.monthlyBusinessExpense * 12;
  const results: YearlyResult[] = [];

  const MICRO_PLAFOND = 77700;
  const microBase = rev * 0.5;
  const microContrib = microBase * 0.45;
  const microNet = rev - exp * 0 - microContrib;
  const microTax = Math.max(0, microNet - 27478) * 0.06;
  const microEligible = rev <= MICRO_PLAFOND;
  results.push({
    status: "micro",
    label: "Micro-entreprise",
    socialContributions: microContrib,
    tax: microTax,
    netIncome: microNet - microTax,
    dividendTax: 0,
    totalTakeHome: microNet - microTax,
    effectiveRate: rev > 0 ? (microContrib + microTax) / rev : 0,
    eligible: microEligible,
    eligibilityNote: microEligible
      ? ""
      : `CA ${(rev / 1000).toFixed(0)} k€ > plafond micro (${(MICRO_PLAFOND / 1000).toFixed(1)} k€) — bascule obligatoire`,
  });

  const eiContrib = socialContributions("ei", rev, exp);
  const eiProfit = Math.max(0, rev - exp - eiContrib);
  const eiTax = eiProfit * 0.3;
  results.push({
    status: "ei",
    label: "EI / Entreprise individuelle",
    eligible: true,
    eligibilityNote: "",
    socialContributions: eiContrib,
    tax: eiTax,
    netIncome: eiProfit - eiTax,
    dividendTax: 0,
    totalTakeHome: eiProfit - eiTax,
    effectiveRate: rev > 0 ? (eiContrib + eiTax) / rev : 0,
  });

  const sasuSalary = 24000;
  const sasuContrib = sasuSalary * 0.42;
  const sasuCorpTax = corporateTax(rev, exp, sasuSalary);
  const sasuDividend = Math.max(0, rev - exp - sasuSalary - sasuContrib - sasuCorpTax);
  const sasuDivTax = sasuDividend * 0.3;
  const sasuTakeHome =
    sasuSalary * 0.83 + (sasuDividend - sasuDivTax);
  results.push({
    status: "sasu",
    label: "SASU",
    eligible: true,
    eligibilityNote: "",
    socialContributions: sasuContrib,
    tax: sasuCorpTax + sasuDivTax,
    netIncome: sasuSalary * 0.83,
    dividendTax: sasuDivTax,
    totalTakeHome: sasuTakeHome,
    effectiveRate: rev > 0
      ? (sasuContrib + sasuCorpTax + sasuDivTax + sasuSalary * 0.17) / rev
      : 0,
  });

  const eurlSalary = 24000;
  const eurlContrib = eurlSalary * 0.42;
  const eurlCorpTax = corporateTax(rev, exp, eurlSalary);
  const eurlDividend = Math.max(0, rev - exp - eurlSalary - eurlContrib - eurlCorpTax);
  const eurlDivTax = eurlDividend * 0.3;
  results.push({
    status: "eurl",
    label: "EURL",
    eligible: true,
    eligibilityNote: "",
    socialContributions: eurlContrib,
    tax: eurlCorpTax + eurlDivTax,
    netIncome: eurlSalary * 0.83,
    dividendTax: eurlDivTax,
    totalTakeHome: eurlSalary * 0.83 + (eurlDividend - eurlDivTax),
    effectiveRate: rev > 0
      ? (eurlContrib + eurlCorpTax + eurlDivTax + eurlSalary * 0.17) / rev
      : 0,
  });

  return results;
}

export function plafonds(): { label: string; limit: number; note: string }[] {
  return [
    { label: "Micro-entreprise (prestations BIC)", limit: 77700, note: "Au-delà: bascule obligatoire en EI ou société" },
    { label: "Micro-entreprise (ventes)", limit: 188700, note: "Au-delà: bascule obligatoire" },
    { label: "Micro social (ACRE maintien)", limit: 47100, note: "Passage du PLA au régime général" },
    { label: "EI au réel", limit: Infinity, note: "Pas de plafond de CA" },
    { label: "EURL / SASU", limit: Infinity, note: "Pas de plafond de CA" },
  ];
}

export function bestStatus(results: YearlyResult[]): {
  best: YearlyResult;
  reason: string;
} {
  const eligible = results.filter((r) => r.eligible);
  const pool = eligible.length > 0 ? eligible : results;
  const best = pool.reduce((a, b) => (b.totalTakeHome > a.totalTakeHome ? b : a));
  const reason = `Statut le plus avantageux: ${best.label} (${best.totalTakeHome.toFixed(0)} € nets/an)`;
  return { best, reason };
}
