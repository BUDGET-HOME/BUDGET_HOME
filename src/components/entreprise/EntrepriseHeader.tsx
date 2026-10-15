"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface EntrepriseHeaderProps {
  user: { email?: string } | null;
}

export default function EntrepriseHeader({ user }: EntrepriseHeaderProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 mb-5 no-print">
      <h1 className="text-2xl font-bold text-slate-900">Gestion Entreprise</h1>
      <div className="flex flex-wrap items-center gap-2">
        <button
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          onClick={() => alert("Export JSON - Fonctionnalité à implémenter")}
        >
          💾 Export JSON
        </button>
        <label className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer">
          📁 Importer
          <input
            type="file"
            accept=".json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) alert("Import - Fonctionnalité à implémenter");
              e.target.value = "";
            }}
          />
        </label>
        <button
          className="rounded-md bg-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          onClick={() => window.print()}
        >
          🖨️ Imprimer / PDF
        </button>
        {user ? (
          <button
            className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100"
            onClick={handleLogout}
          >
            Déconnexion ({user.email})
          </button>
        ) : (
          <a
            href="/login"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Se connecter / S&apos;inscrire
          </a>
        )}
      </div>
    </header>
  );
}
