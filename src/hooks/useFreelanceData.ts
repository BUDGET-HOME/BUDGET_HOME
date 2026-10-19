"use client";

import { useCallback } from "react";
import type { FreelanceData } from "@/lib/entreprise-state";
import { useEntrepriseContext } from "./useEntreprise";

export type FreelanceSimulatorData = FreelanceData;

export function useFreelanceData() {
  const { state, loaded, saving, update } = useEntrepriseContext();

  const saveData = useCallback(
    async (updates: Partial<FreelanceData>) => {
      update((prev) => ({ ...prev, freelance: { ...prev.freelance, ...updates } }));
      return true;
    },
    [update]
  );

  const saveField = useCallback(
    async <K extends keyof FreelanceData>(field: K, value: FreelanceData[K]) => {
      return saveData({ [field]: value } as Partial<FreelanceData>);
    },
    [saveData]
  );

  return {
    data: state.freelance,
    loading: !loaded,
    error: null as string | null,
    saving,
    saveData,
    saveField,
  };
}
