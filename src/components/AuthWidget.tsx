"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function AuthWidget() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError("Identifiants invalides.");
      return;
    }
    router.push("/");
    router.refresh();
  };

  return (
    <main className="mx-auto max-w-md w-full">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">BUDGET_HOME</h1>
        <p className="text-slate-500 mt-1">Gestion de budget familial et simulateur d'achat immobilier</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-xl p-6 md:p-8 border border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 mb-1">Connexion</h2>
        <p className="text-sm text-slate-500 mb-6">Veuillez vous connecter pour accéder à l'application</p>
        
        {error && (
          <p className="mb-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-500 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-500 mb-1">
              Mot de passe
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-blue-600 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Connexion…" : "Se connecter"}
          </button>
          <div className="flex items-center justify-between pt-2">
            <p className="text-sm text-slate-500">
              Pas de compte ?{" "}
              <Link href="/signup" className="text-blue-600 font-semibold underline">
                S'inscrire
              </Link>
            </p>
            <p className="text-sm">
              <Link href="/reset" className="text-slate-500 underline">
                Mot de passe oublié ?
              </Link>
            </p>
          </div>
        </form>
      </div>
    </main>
  );
}
