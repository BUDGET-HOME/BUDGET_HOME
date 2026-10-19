import { parseCashFlow } from "./entreprise-backup";
import { readStoredCashFlow } from "./entreprise-backup";
import {
  defaultEntreprise,
  normalizeEntreprise,
  withLocalCashFlowIfEmpty,
  type EntrepriseState,
} from "./entreprise-state";

export const ENTREPRISE_STORAGE_KEY = "entreprise_v1";

export function loadLocalEntreprise(): EntrepriseState {
  if (typeof window === "undefined") return defaultEntreprise();
  const raw = localStorage.getItem(ENTREPRISE_STORAGE_KEY);
  let state = defaultEntreprise();
  if (raw) {
    try {
      state = normalizeEntreprise(JSON.parse(raw) as unknown);
    } catch {
      state = defaultEntreprise();
    }
  }
  const legacyCash = parseCashFlow(readStoredCashFlow());
  return withLocalCashFlowIfEmpty(state, legacyCash).state;
}

export function saveLocalEntreprise(state: EntrepriseState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ENTREPRISE_STORAGE_KEY, JSON.stringify(state));
  localStorage.setItem("cashFlowData", JSON.stringify(state.cashFlow));
}

export async function saveEntrepriseToServer(state: EntrepriseState): Promise<void> {
  const res = await fetch("/api/entreprise", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: state }),
  });
  if (!res.ok) throw new Error(`save_failed_${res.status}`);
}

export async function loadEntrepriseFromServer(): Promise<EntrepriseState | null> {
  const res = await fetch("/api/entreprise");
  if (res.status === 401) throw new Error("unauthorized");
  if (!res.ok) throw new Error(`load_failed_${res.status}`);
  const json = (await res.json()) as { document?: unknown | null };
  if (json.document == null) return null;
  return normalizeEntreprise(json.document);
}
