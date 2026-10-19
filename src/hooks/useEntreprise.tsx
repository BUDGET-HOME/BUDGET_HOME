"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { parseCashFlow, readStoredCashFlow } from "@/lib/entreprise-backup";
import {
  loadEntrepriseFromServer,
  loadLocalEntreprise,
  saveEntrepriseToServer,
  saveLocalEntreprise,
} from "@/lib/entreprise-service";
import { defaultEntreprise, withLocalCashFlowIfEmpty, type EntrepriseState } from "@/lib/entreprise-state";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { SyncStatus } from "@/lib/budget-service";

const DEBOUNCE_MS = 2000;

interface EntrepriseContextValue {
  state: EntrepriseState;
  user: User | null;
  loaded: boolean;
  saving: boolean;
  syncStatus: SyncStatus;
  update: (recipe: (prev: EntrepriseState) => EntrepriseState) => void;
  replaceState: (next: EntrepriseState) => void;
}

const EntrepriseContext = createContext<EntrepriseContextValue | null>(null);

export function EntrepriseProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<EntrepriseState>(defaultEntreprise);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(() => !isSupabaseConfigured());
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef(state);
  const userRef = useRef(user);
  const canSyncRef = useRef(false);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const pushServer = useCallback((force: boolean) => {
    if (!userRef.current) return;
    if (!force && !canSyncRef.current) return;
    setSaving(true);
    setSyncStatus("saving");
    saveEntrepriseToServer(stateRef.current)
      .then(() => {
        canSyncRef.current = true;
        setSyncStatus("saved");
      })
      .catch(() => setSyncStatus("error"))
      .finally(() => setSaving(false));
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user: current } }) => {
      setUser(current);
      setAuthReady(true);
    }).catch(() => setAuthReady(true));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!authReady) return;
    let cancelled = false;
    (async () => {
      if (!user) {
        canSyncRef.current = false;
        const local = loadLocalEntreprise();
        if (!cancelled) {
          setState(local);
          setLoaded(true);
        }
        return;
      }
      try {
        const remote = await loadEntrepriseFromServer();
        if (cancelled) return;
        if (remote) {
          const merged = withLocalCashFlowIfEmpty(remote, parseCashFlow(readStoredCashFlow()));
          setState(merged.state);
          saveLocalEntreprise(merged.state);
          if (merged.changed) await saveEntrepriseToServer(merged.state);
        } else {
          const local = loadLocalEntreprise();
          setState(local);
          await saveEntrepriseToServer(local);
        }
        if (cancelled) return;
        canSyncRef.current = true;
        setSyncStatus("saved");
      } catch {
        if (cancelled) return;
        canSyncRef.current = false;
        setState(loadLocalEntreprise());
        setSyncStatus("error");
      }
      if (!cancelled) setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [authReady, user]);

  const update = useCallback(
    (recipe: (prev: EntrepriseState) => EntrepriseState) => {
      setState((prev) => {
        const next = recipe(prev);
        stateRef.current = next;
        saveLocalEntreprise(next);
        return next;
      });
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => pushServer(false), DEBOUNCE_MS);
    },
    [pushServer]
  );

  const replaceState = useCallback(
    (next: EntrepriseState) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      stateRef.current = next;
      setState(next);
      saveLocalEntreprise(next);
      pushServer(true);
    },
    [pushServer]
  );

  return (
    <EntrepriseContext.Provider value={{ state, user, loaded, saving, syncStatus, update, replaceState }}>
      {children}
    </EntrepriseContext.Provider>
  );
}

export function useEntrepriseContext(): EntrepriseContextValue {
  const value = useContext(EntrepriseContext);
  if (!value) throw new Error("EntrepriseProvider manquant");
  return value;
}
