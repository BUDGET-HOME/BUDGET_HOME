import { createBrowserClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "./env";

export function createClient() {
  return createBrowserClient(supabaseUrl(), supabaseAnonKey());
}

/** Null when Supabase is not configured, so local mode does not wait on the network. */
export async function getOptionalUser(): Promise<User | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data } = await createClient().auth.getUser();
    return data.user ?? null;
  } catch {
    return null;
  }
}
