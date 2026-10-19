"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { passwordChangeError } from "@/lib/password";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const passwordError = passwordChangeError(password, confirm);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    if (data.session) {
      router.push("/");
      router.refresh();
    } else {
      setNotice("Compte créé ! Vérifiez vos emails pour confirmer votre inscription.");
    }
  };

  return (
    <main className="mx-auto max-w-md p-5">
      <h1 className="text-2xl font-bold mb-6">Créer un compte</h1>
      {error && (
        <p className="mb-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {notice && (
        <p className="mb-4 rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700">
          {notice}
        </p>
      )}
      <form onSubmit={handleSignup} className="budget-card space-y-4">
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
        <div>
          <label className="block text-sm font-semibold text-slate-500 mb-1">
            Mot de passe (min. 8 caractères)
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
          <label className="block text-sm font-semibold text-slate-500 mb-1">
            Confirmation
          </label>
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
          {loading ? "Création…" : "S'inscrire"}
        </button>
        <p className="text-sm text-center text-slate-500">
          Déjà inscrit ?{" "}
          <Link href="/login" className="text-blue-600 font-semibold underline">
            Se connecter
          </Link>
        </p>
      </form>
    </main>
  );
}
