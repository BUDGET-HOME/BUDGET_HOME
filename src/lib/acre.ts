/** Barème auto-entrepreneur prestations de services utilisé par le simulateur. */
export const MICRO_URSSAF_RATE = 21.2;

/** PASS 2026. L'ACRE dirigeant s'éteint à ce plafond et devient dégressive dès 75 %. */
export const PASS_2026 = 48060;
export const PASS_2026_ACRE_FULL = 36045;

const ACRE_REFORM = new Date(2026, 6, 1);
const MICRO_LEGACY_RATE = 10.6;
const MICRO_CURRENT_RATE = 15.9;

export function parseIsoDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Fin du 3e trimestre civil qui suit le trimestre de début d'activité. */
export function microAcreWindowEnd(start: Date): Date {
  const quarter = Math.floor(start.getMonth() / 3);
  const endMonthExclusive = (quarter + 4) * 3;
  const year = start.getFullYear() + Math.floor(endMonthExclusive / 12);
  const month = endMonthExclusive % 12;
  return new Date(year, month, 0);
}

export function acreMicroWindowOpen(activityStart: string, onDate: Date): boolean {
  const start = parseIsoDate(activityStart);
  if (!start) return true;
  if (onDate < start) return true;
  return onDate <= microAcreWindowEnd(start);
}

export function acreDirectorWindowOpen(activityStart: string, onDate: Date): boolean {
  const start = parseIsoDate(activityStart);
  if (!start) return true;
  if (onDate < start) return true;
  const end = new Date(start.getFullYear() + 1, start.getMonth(), start.getDate());
  return onDate <= end;
}

export interface MicroAcre {
  rate: number;
  label: string;
  active: boolean;
}

/**
 * Micro : exonération de 50 % jusqu'au 30/06/2026 (taux 10,6 %),
 * puis de 25 % (taux 15,9 %) jusqu'à la fin du 3e trimestre civil suivant.
 */
export function describeMicroAcre(active: boolean, activityStart: string, onDate = new Date()): MicroAcre {
  if (!active) {
    return { rate: MICRO_URSSAF_RATE, label: "21,2 % (ACRE : non)", active: false };
  }
  if (!acreMicroWindowOpen(activityStart, onDate)) {
    return { rate: MICRO_URSSAF_RATE, label: "21,2 % (ACRE terminée)", active: false };
  }
  const start = parseIsoDate(activityStart);
  const legacy = (start ?? onDate) < ACRE_REFORM;
  if (legacy) {
    return { rate: MICRO_LEGACY_RATE, label: "10,6 % (ACRE −50 %, avant le 01/07/2026)", active: true };
  }
  return { rate: MICRO_CURRENT_RATE, label: "15,9 % (ACRE −25 %, depuis le 01/07/2026)", active: true };
}

/** Exonération de cotisations du dirigeant : 25 % jusqu'à 75 % du PASS, puis dégressive jusqu'au PASS. */
export function acreDirectorExemption(
  active: boolean,
  annualIncome: number,
  activityStart: string,
  onDate = new Date(),
): number {
  if (!active || !acreDirectorWindowOpen(activityStart, onDate)) return 0;
  if (annualIncome <= PASS_2026_ACRE_FULL) return 0.25;
  if (annualIncome >= PASS_2026) return 0;
  return (0.25 * (PASS_2026 - annualIncome)) / (PASS_2026 - PASS_2026_ACRE_FULL);
}
