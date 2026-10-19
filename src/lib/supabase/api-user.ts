import { isSupabaseConfigured } from "./env";
import { createClient } from "./server";

export async function requireApiUser() {
  if (!isSupabaseConfigured()) {
    return { error: Response.json({ error: "supabase_not_configured" }, { status: 503 }) };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: Response.json({ error: "unauthorized" }, { status: 401 }) };
  }
  return { supabase, user };
}
