"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { SyncStatus } from "@/lib/budget-service";

interface PageHeaderProps {
  title: string;
  user: { email?: string } | null;
  syncStatus: SyncStatus;
  onExport: () => void;
  onImport: (file: File) => void;
  compact?: boolean;
}

const SYNC_LABEL: Record<SyncStatus, string> = {
  idle: "",
  saving: "💾 Sauvegarde…",
  saved: "✓ Sauvegardé",
  error: "⚠️ Erreur de sauvegarde",
  offline: "Mode local",
};

export default function PageHeader({
  title,
  user,
  syncStatus,
  onExport,
  onImport,
  compact = false,
}: PageHeaderProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const syncLabel = SYNC_LABEL[syncStatus];

  const handleLogout = async () => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  };

  return (
    <header className={`flex flex-wrap items-center justify-between no-print ${compact ? "mb-0 gap-2" : "mb-5 gap-3"}`}>
      <h1 className={`font-bold text-slate-900 ${compact ? "text-lg" : "text-2xl"}`}>{title}</h1>
      <div className="flex flex-wrap items-center gap-2">
        {user && syncLabel ? (
          <span className="text-sm text-slate-600">{syncLabel}</span>
        ) : null}
        <button
          type="button"
          title="Télécharger une copie JSON"
          className={`rounded-md border border-slate-300 bg-white font-semibold text-slate-700 hover:bg-slate-50 ${compact ? "px-2 py-1 text-xs" : "px-4 py-2 text-sm"}`}
          onClick={onExport}
        >
          Exporter
        </button>
        <button
          type="button"
          title="Charger un fichier JSON"
          className={`rounded-md border border-slate-300 bg-white font-semibold text-slate-700 hover:bg-slate-50 ${compact ? "px-2 py-1 text-xs" : "px-4 py-2 text-sm"}`}
          onClick={() => fileRef.current?.click()}
        >
          Importer
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          aria-label="Fichier JSON à importer"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onImport(file);
            event.target.value = "";
          }}
        />
        <button
          type="button"
          className={`rounded-md bg-slate-700 font-semibold text-white hover:bg-slate-800 ${compact ? "px-2 py-1 text-xs" : "px-4 py-2 text-sm"}`}
          onClick={() => window.print()}
        >
          🖨️ Imprimer / PDF
        </button>
        {user ? (
          <button
            type="button"
            className={`rounded-md border border-red-200 bg-red-50 font-semibold text-red-600 hover:bg-red-100 ${compact ? "px-2 py-1 text-xs" : "px-4 py-2 text-sm"}`}
            onClick={handleLogout}
          >
            Déconnexion ({user.email})
          </button>
        ) : (
          <a
            href="/login"
            className={`rounded-md bg-blue-600 font-semibold text-white hover:bg-blue-700 ${compact ? "px-2 py-1 text-xs" : "px-4 py-2 text-sm"}`}
          >
            Se connecter / S&apos;inscrire
          </a>
        )}
      </div>
    </header>
  );
}
