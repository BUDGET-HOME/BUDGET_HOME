"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { recoveryRedirect } from "@/lib/password";

export default function ResetPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: recoveryRedirect(window.location.origin),
    });
    setLoading(false);
    if (resetError) {
      setError("L'envoi de l'email a échoué. Réessayez.");
      return;
    }
    setSent(true);
  };

  return (
    <main className="mx-auto max-w-md p-5">
      <h1 className="text-2xl font-bold mb-6">Mot de passe oublié</h1>
      {error && (
        <p className="mb-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {sent ? (
        <p className="rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700">
          Si un compte existe pour {email}, un email de réinitialisation a été envoyé.
        </p>
      ) : (
        <form onSubmit={handleReset} className="budget-card space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-500 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-blue-600 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Envoi…" : "Envoyer le lien de réinitialisation"}
          </button>
          <p className="text-sm text-center">
            <Link href="/login" className="text-slate-500 underline">
              Retour à la connexion
            </Link>
          </p>
        </form>
      )}
    </main>
  );
}
