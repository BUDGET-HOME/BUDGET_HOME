export function supabaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    process.env.NEXT_PUBLIC_SUPABASE_DB_SUPABASE_URL ??
    ""
  );
}

export function supabaseAnonKey(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_DB_SUPABASE_ANON_KEY ??
    ""
  );
}

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl() && supabaseAnonKey());
}
