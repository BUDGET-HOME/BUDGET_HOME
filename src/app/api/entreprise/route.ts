import { newestRow } from "@/lib/json-document";
import { readUserDocuments, responseForStoreError, writeUserDocument } from "@/lib/json-document-store";
import { legacyEntrepriseRows } from "@/lib/entreprise-state";
import { requireApiUser } from "@/lib/supabase/api-user";
import type { SupabaseClient } from "@supabase/supabase-js";

async function newestLegacyRow(
  supabase: SupabaseClient,
  table: string,
  userId: string
): Promise<Record<string, unknown> | null> {
  const { data, error } = await supabase.from(table).select("*").eq("user_id", userId);
  if (error || !Array.isArray(data) || data.length === 0) return null;
  const dated = data.map((row: Record<string, unknown>, index: number) => ({
    id: typeof row.id === "string" ? row.id : String(index),
    updated_at: typeof row.updated_at === "string" ? row.updated_at : "",
    row,
  }));
  return newestRow(dated)?.row ?? null;
}

export async function GET() {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const read = await readUserDocuments(auth.supabase, "entreprise", auth.user.id);
  if ("missingTable" in read || "error" in read) return responseForStoreError(read);

  const row = newestRow(read.rows);
  if (row?.data && typeof row.data === "object") {
    return Response.json({ document: row.data });
  }

  const freelance = await newestLegacyRow(auth.supabase, "freelance_simulator", auth.user.id);
  const gantt = await newestLegacyRow(auth.supabase, "gantt_simulator", auth.user.id);
  const legacy = legacyEntrepriseRows(freelance, gantt);
  if (!legacy) return Response.json({ document: null });

  await writeUserDocument(auth.supabase, "entreprise", auth.user.id, legacy);
  return Response.json({ document: legacy });
}

export async function PUT(request: Request) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const data =
    payload && typeof payload === "object" && "data" in payload
      ? (payload as { data: unknown }).data
      : null;
  if (!data || typeof data !== "object") {
    return Response.json({ error: "invalid_document" }, { status: 400 });
  }

  const written = await writeUserDocument(auth.supabase, "entreprise", auth.user.id, data);
  if ("missingTable" in written || "error" in written) return responseForStoreError(written);
  return Response.json({ ok: true, id: written.id });
}
