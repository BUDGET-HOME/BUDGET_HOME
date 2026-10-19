"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { SyncStatus } from "@/lib/budget-service";
import type { BudgetState } from "@/lib/types";

interface EntrepriseHeaderProps {
  user: { email?: string } | null;
  syncStatus: SyncStatus;
  state: BudgetState;
  onImport: (file: File) => void;
}

const SYNC_LABEL: Record<SyncStatus, string> = {
  idle: "",
  saving: "💾 Sauvegarde…",
  saved: "✓ Sauvegardé",
  error: "⚠️ Erreur de sauvegarde",
  offline: "Mode local",
};

export default function EntrepriseHeader({ user, syncStatus, state, onImport }: EntrepriseHeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    if (!isSupabaseConfigured()) return;
    await createClient().auth.signOut();
    router.refresh();
  };

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 mb-5 no-print">
      <h1 className="text-2xl font-bold text-slate-900">Gestion Entreprise</h1>
      <div className="flex flex-wrap items-center gap-2">
        {user && (
          <span className="text-sm text-slate-600">
            {SYNC_LABEL[syncStatus] || ""}
          </span>
        )}
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
