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
    <header className="flex flex-wrap items-center justify-between gap-3 mb-5 no-print">
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      <div className="flex flex-wrap items-center gap-2">
        {user && syncLabel ? (
          <span className="text-sm text-slate-600">{syncLabel}</span>
        ) : null}
        <button
          type="button"
          title="Télécharger une copie JSON"
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          onClick={onExport}
        >
          Exporter
        </button>
        <button
          type="button"
          title="Charger un fichier JSON"
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
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
          className="rounded-md bg-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          onClick={() => window.print()}
        >
          🖨️ Imprimer / PDF
        </button>
        {user ? (
          <button
            type="button"
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
