"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { passwordChangeError } from "@/lib/password";

type Status = "loading" | "ready" | "expired";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("loading");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setStatus("expired");
      return;
    }
    const params = new URLSearchParams(window.location.search);
    if (params.get("error")) {
      setStatus("expired");
      return;
    }

    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
        setStatus("ready");
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      setStatus((current) => {
        if (current === "ready") return current;
        return data.session ? "ready" : "expired";
      });
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const passwordError = passwordChangeError(password, confirm);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) {
      setError("Impossible d'enregistrer le mot de passe. Le lien est peut-être expiré.");
      return;
    }
    router.push("/");
    router.refresh();
  };

  if (!isSupabaseConfigured()) {
    return (
      <main className="mx-auto max-w-md p-5">
        <h1 className="text-2xl font-bold mb-6">Nouveau mot de passe</h1>
        <p className="text-sm text-slate-600">La réinitialisation nécessite un compte configuré.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md p-5">
      <h1 className="text-2xl font-bold mb-6">Nouveau mot de passe</h1>
      {status === "loading" && <p className="text-slate-500">Vérification du lien…</p>}
      {status === "expired" && (
        <div className="budget-card space-y-4">
          <p className="text-sm text-red-700">
            Ce lien est invalide ou expiré. Demandez un nouvel email de réinitialisation.
          </p>
          <Link href="/reset" className="inline-block text-sm font-semibold text-blue-600 underline">
            Mot de passe oublié
          </Link>
        </div>
      )}
      {status === "ready" && (
        <form onSubmit={handleSubmit} className="budget-card space-y-4">
          {error && (
            <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          <div>
            <label className="block text-sm font-semibold text-slate-500 mb-1">
              Nouveau mot de passe (min. 8 caractères)
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-500 mb-1">Confirmation</label>
            <input
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-blue-600 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Enregistrement…" : "Enregistrer le mot de passe"}
          </button>
        </form>
      )}
    </main>
  );
}
