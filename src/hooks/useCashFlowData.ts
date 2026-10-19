"use client";

import { useCallback } from "react";
import type { CashFlowBackup, CashFlowBackupItem } from "@/lib/entreprise-backup";
import { useEntrepriseContext } from "./useEntreprise";

export type CashFlowFrequency = CashFlowBackupItem["frequency"];
export type CashFlowItem = CashFlowBackupItem;
export type CashFlowData = CashFlowBackup;

export function useCashFlowData() {
  const { state, loaded, saving, update } = useEntrepriseContext();

  const saveData = useCallback(
    async (updates: Partial<CashFlowData>) => {
      update((prev) => ({ ...prev, cashFlow: { ...prev.cashFlow, ...updates } }));
      return true;
    },
    [update]
  );

  const saveField = useCallback(
    async <K extends keyof CashFlowData>(field: K, value: CashFlowData[K]) => {
      return saveData({ [field]: value } as Partial<CashFlowData>);
    },
    [saveData]
  );

  const addItem = useCallback(
    async (item: Omit<CashFlowItem, "id">) => {
      update((prev) => ({
        ...prev,
        cashFlow: {
          ...prev.cashFlow,
          items: [...prev.cashFlow.items, { ...item, id: Date.now().toString() }],
        },
      }));
      return true;
    },
    [update]
  );

  const updateItem = useCallback(
    async (id: string, updates: Partial<CashFlowItem>) => {
      update((prev) => ({
        ...prev,
        cashFlow: {
          ...prev.cashFlow,
          items: prev.cashFlow.items.map((item) => (item.id === id ? { ...item, ...updates } : item)),
        },
      }));
      return true;
    },
    [update]
  );

  const deleteItem = useCallback(
    async (id: string) => {
      update((prev) => ({
        ...prev,
        cashFlow: {
          ...prev.cashFlow,
          items: prev.cashFlow.items.filter((item) => item.id !== id),
        },
      }));
      return true;
    },
    [update]
  );

  return {
    data: state.cashFlow,
    loading: !loaded,
    error: null as string | null,
    saving,
    saveData,
    saveField,
    addItem,
    updateItem,
    deleteItem,
  };
}
