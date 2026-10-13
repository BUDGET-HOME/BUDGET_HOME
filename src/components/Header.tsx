"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { SyncStatus } from "@/lib/budget-service";
import { exportJSON } from "@/lib/budget-service";
import type { BudgetState } from "@/lib/types";

interface HeaderProps {
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

export default function Header({ user, syncStatus, state, onImport }: HeaderProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 mb-5 no-print">
      <h1 className="text-2xl font-bold text-slate-900">💰 Budget & Projet Immo</h1>
      <div className="flex flex-wrap items-center gap-2">
        {user && (
          <span className="text-sm text-slate-600">
            {SYNC_LABEL[syncStatus] || ""}
          </span>
        )}
        <button
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          onClick={() => exportJSON(state)}
        >
          💾 Export JSON
        </button>
        <label className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer">
          📂 Importer
          <input
            type="file"
            accept=".json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onImport(f);
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
