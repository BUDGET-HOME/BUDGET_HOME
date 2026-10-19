import type { SupabaseClient } from "@supabase/supabase-js";
import { isMissingTableError, keepPlan, newestRow, type DatedId } from "./json-document";

export interface StoredDocument extends DatedId {
  data: unknown;
}

type StoreResult<T> = T | { missingTable: true } | { error: string };

function asRows(data: unknown): StoredDocument[] {
  if (!Array.isArray(data)) return [];
  return data.filter((row): row is StoredDocument => {
    return !!row && typeof row === "object" && typeof (row as StoredDocument).id === "string";
  }).map((row) => ({
    id: row.id,
    updated_at: typeof row.updated_at === "string" ? row.updated_at : "",
    data: row.data,
  }));
}

export async function readUserDocuments(
  supabase: SupabaseClient,
  table: string,
  userId: string
): Promise<StoreResult<{ rows: StoredDocument[] }>> {
  const { data, error } = await supabase
    .from(table)
    .select("id, updated_at, data")
    .eq("user_id", userId);
  if (error) {
    if (isMissingTableError(error)) return { missingTable: true };
    return { error: error.message };
  }
  return { rows: asRows(data) };
}

export async function writeUserDocument(
  supabase: SupabaseClient,
  table: string,
  userId: string,
  data: unknown
): Promise<StoreResult<{ id: string }>> {
  const existing = await readUserDocuments(supabase, table, userId);
  if ("missingTable" in existing || "error" in existing) return existing;

  const plan = keepPlan(existing.rows);
  if (!plan) {
    const inserted = await supabase
      .from(table)
      .insert({ user_id: userId, data })
      .select("id")
      .single();
    if (inserted.error) {
      if (isMissingTableError(inserted.error)) return { missingTable: true };
      return { error: inserted.error.message };
    }
    return { id: String(inserted.data.id) };
  }

  const updated = await supabase
    .from(table)
    .update({ data, updated_at: new Date().toISOString() })
    .eq("id", plan.keepId);
  if (updated.error) return { error: updated.error.message };

  if (plan.deleteIds.length > 0) {
    await supabase.from(table).delete().in("id", plan.deleteIds);
  }
  return { id: plan.keepId };
}

export function responseForStoreError(result: { missingTable: true } | { error: string }): Response {
  if ("missingTable" in result) {
    return Response.json({ error: "table_missing" }, { status: 503 });
  }
  return Response.json({ error: result.error }, { status: 500 });
}

export { newestRow };
