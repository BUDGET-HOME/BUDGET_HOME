export interface DatedId {
  id: string;
  updated_at: string;
}

export function newestRow<T extends DatedId>(rows: T[]): T | null {
  if (rows.length === 0) return null;
  return [...rows].sort((a, b) => {
    if (a.updated_at !== b.updated_at) return a.updated_at < b.updated_at ? 1 : -1;
    return a.id < b.id ? 1 : -1;
  })[0];
}

/** Garde la ligne la plus récente et indique les doublons à retirer. */
export function keepPlan(rows: DatedId[]): { keepId: string; deleteIds: string[] } | null {
  const keep = newestRow(rows);
  if (!keep) return null;
  return {
    keepId: keep.id,
    deleteIds: rows.filter((row) => row.id !== keep.id).map((row) => row.id),
  };
}

export function isMissingTableError(
  error: { code?: string; message?: string } | null | undefined
): boolean {
  if (!error) return false;
  if (error.code === "PGRST205" || error.code === "42P01") return true;
  return /does not exist|schema cache|could not find the table/i.test(error.message ?? "");
}
