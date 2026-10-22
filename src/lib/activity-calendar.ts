export function formatIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Date locale AAAA-MM-JJ, ou null si la valeur est vide ou invalide. */
export function parseActivityStart(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}

/** Premier jour du mois de début d'activité. Sans date, le mois de repli. */
export function activityMonthStart(value: string, fallback = new Date()): Date {
  const parsed = parseActivityStart(value) ?? fallback;
  return new Date(parsed.getFullYear(), parsed.getMonth(), 1);
}

export function addCalendarMonths(origin: Date, count: number): Date {
  return new Date(origin.getFullYear(), origin.getMonth() + count, 1);
}

/** Jour de début conservé, ou le jour de repli si la date n'est pas saisie. */
export function activityStartIso(value: string, fallback = new Date()): string {
  return formatIsoDate(parseActivityStart(value) ?? fallback);
}

export function formatActivityMonth(date: Date): string {
  return date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}
