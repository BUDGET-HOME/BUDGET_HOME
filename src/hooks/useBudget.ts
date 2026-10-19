"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  loadFromServer,
  loadLocal,
  saveLocal,
  saveToServer,
  type SyncStatus,
} from "@/lib/budget-service";
import { DEFAULT_STATE, type BudgetState } from "@/lib/types";

const DEBOUNCE_MS = 2000;

export function useBudget() {
  const [state, setState] = useState<BudgetState>({ ...DEFAULT_STATE });
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(() => !isSupabaseConfigured());
  const [loaded, setLoaded] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef(state);
  const userRef = useRef(user);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
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
      if (user) {
        try {
          const serverState = await loadFromServer();
          if (!cancelled) {
            setState(serverState ?? loadLocal());
          }
        } catch {
          if (!cancelled) setSyncStatus("error");
        }
      } else {
        setState(loadLocal());
      }
      if (!cancelled) setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [authReady, user]);

  const saveNow = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!userRef.current) return;
    setSyncStatus("saving");
    saveToServer(stateRef.current)
      .then(() => setSyncStatus("saved"))
      .catch(() => setSyncStatus("error"));
  }, []);

  const update = useCallback(
    (updater: (prev: BudgetState) => BudgetState) => {
      setState((prev) => {
        const next = updater(prev);
        saveLocal(next);
        return next;
      });
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(saveNow, DEBOUNCE_MS);
    },
    [saveNow]
  );

  const replaceState = useCallback(
    (next: BudgetState) => {
      stateRef.current = next;
      setState(next);
      saveLocal(next);
      saveNow();
    },
    [saveNow]
  );

  return { state, update, replaceState, user, authReady, loaded, syncStatus, saveNow };
}
