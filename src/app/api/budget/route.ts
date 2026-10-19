import { newestRow } from "@/lib/json-document";
import { readUserDocuments, responseForStoreError, writeUserDocument } from "@/lib/json-document-store";
import { requireApiUser } from "@/lib/supabase/api-user";

export async function GET() {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const read = await readUserDocuments(auth.supabase, "budgets", auth.user.id);
  if ("missingTable" in read || "error" in read) return responseForStoreError(read);

  const row = newestRow(read.rows);
  return Response.json({
    budget: row
      ? { id: row.id, name: "Budget principal", data: row.data, updated_at: row.updated_at }
      : null,
  });
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
    return Response.json({ error: "invalid_budget" }, { status: 400 });
  }

  const written = await writeUserDocument(auth.supabase, "budgets", auth.user.id, data);
  if ("missingTable" in written || "error" in written) return responseForStoreError(written);
  return Response.json({ ok: true, id: written.id });
}
