export type CompanyStatus = "micro" | "ei" | "eurl" | "sasu";

export interface LaunchSimInput {
  status: CompanyStatus;
  regionMonthlyGrant: number;
  regionGrantMonths: number;
  acre: boolean;
  personalContribution: number;
  monthlyProvision: number;
}

export interface MonthResource {
  month: number;
  grant: number;
  provisionUsed: number;
  total: number;
}

export interface LaunchSimResult {
  totalAcreExemption: number;
  totalGrants: number;
  monthlyLow: number;
  monthlyHigh: number;
  runwayMonths: number;
  months: MonthResource[];
}

const PLAFOND_SECURITE_SOCIALE = 47100;

export function acreRate(status: CompanyStatus): number {
  switch (status) {
    case "micro":
      return 0.12;
    case "ei":
      return 0.12;
    case "eurl":
      return 0.05;
    case "sasu":
      return 0.07;
  }
}

export function simulateLaunch(
  input: LaunchSimInput,
  monthlyLow: number,
  monthlyHigh: number
): LaunchSimResult {
  const months: MonthResource[] = [];
  const grantMonths = Math.max(0, input.regionGrantMonths);
  let totalGrants = 0;
  for (let m = 1; m <= grantMonths; m++) {
    totalGrants += input.regionMonthlyGrant;
    months.push({ month: m, grant: input.regionMonthlyGrant, provisionUsed: 0, total: input.regionMonthlyGrant });
  }

  let provision = input.personalContribution;
  let runwayMonths = grantMonths;
  const avgNeed = (monthlyLow + monthlyHigh) / 2;
  for (let m = grantMonths + 1; m <= 36; m++) {
    const need = avgNeed;
    if (provision >= need) {
      provision -= need;
      months.push({ month: m, grant: 0, provisionUsed: need, total: need });
      runwayMonths = m;
    } else {
      break;
    }
  }

  const s1 = PLAFOND_SECURITE_SOCIALE * 0.5 * acreRate(input.status);
  const totalAcreExemption = input.acre ? s1 : 0;

  return {
    totalAcreExemption,
    totalGrants,
    monthlyLow,
    monthlyHigh,
    runwayMonths,
    months,
  };
}
