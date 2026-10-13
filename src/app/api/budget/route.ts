import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/middleware";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return Response.json({ error: "supabase_not_configured" }, { status: 503 });
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("budgets")
    .select("id, name, data, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json({ budget: data });
}

export async function PUT(request: Request) {
  if (!isSupabaseConfigured()) {
    return Response.json({ error: "supabase_not_configured" }, { status: 503 });
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const data = payload && typeof payload === "object" && "data" in payload
    ? (payload as { data: unknown }).data
    : null;

  if (!data || typeof data !== "object") {
    return Response.json({ error: "invalid_budget" }, { status: 400 });
  }

  const existing = await supabase
    .from("budgets")
    .select("id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (existing.data) {
    const { error } = await supabase
      .from("budgets")
      .update({ data, updated_at: new Date().toISOString() })
      .eq("id", existing.data.id);
    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }
    return Response.json({ ok: true, id: existing.data.id });
  }

  const { data: inserted, error } = await supabase
    .from("budgets")
    .insert({ user_id: user.id, data })
    .select("id")
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json({ ok: true, id: inserted.id });
}
