"use client";

import { useState, useEffect, useCallback } from "react";

export type CashFlowFrequency = "ponctuel" | "mensuel" | "trimestriel" | "annuel";

export interface CashFlowItem {
  id: string;
  label: string;
  amount: number;
  type: "credit" | "debit";
  frequency: CashFlowFrequency;
  startDate: string;
  endDate: string | null;
  category: string;
  notes: string;
}

export interface CashFlowData {
  items: CashFlowItem[];
  initialBalance: number;
}

const DEFAULT_DATA: CashFlowData = {
  items: [],
  initialBalance: 0,
};

export function useCashFlowData() {
  const [data, setData] = useState<CashFlowData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  // Initialize with default data
  useEffect(() => {
    setLoading(true);
    // Load from localStorage if available
    try {
      const saved = localStorage.getItem("cashFlowData");
      if (saved) {
        setData(JSON.parse(saved));
      } else {
        setData(DEFAULT_DATA);
      }
    } catch {
      setData(DEFAULT_DATA);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save to localStorage
  const saveToLocalStorage = useCallback((newData: CashFlowData) => {
    try {
      localStorage.setItem("cashFlowData", JSON.stringify(newData));
    } catch (err) {
      console.error("Error saving to localStorage:", err);
    }
  }, []);

  const saveData = useCallback(async (updates: Partial<CashFlowData>) => {
    setSaving(true);
    setError(null);
    
    try {
      const currentData = data || DEFAULT_DATA;
      const mergedData: CashFlowData = { ...currentData, ...updates };
      setData(mergedData);
      saveToLocalStorage(mergedData);
      return true;
    } catch (err) {
      console.error("Unexpected error saving:", err);
      setError("Erreur lors de la sauvegarde");
      setSaving(false);
      return false;
    } finally {
      setSaving(false);
    }
  }, [data, saveToLocalStorage]);

  const saveField = useCallback(async <K extends keyof CashFlowData>(
    field: K,
    value: CashFlowData[K]
  ) => {
    return saveData({ [field]: value } as Partial<CashFlowData>);
  }, [saveData]);

  const addItem = useCallback(async (item: Omit<CashFlowItem, 'id'>) => {
    const currentItems = data?.items || [];
    const newItem: CashFlowItem = {
      ...item,
      id: Date.now().toString(),
    };
    return saveData({ items: [...currentItems, newItem] });
  }, [data, saveData]);

  const updateItem = useCallback(async (id: string, updates: Partial<CashFlowItem>) => {
    const currentItems = data?.items || [];
    const updatedItems = currentItems.map(item => 
      item.id === id ? { ...item, ...updates } : item
    );
    return saveData({ items: updatedItems });
  }, [data, saveData]);

  const deleteItem = useCallback(async (id: string) => {
    const currentItems = data?.items || [];
    const filteredItems = currentItems.filter(item => item.id !== id);
    return saveData({ items: filteredItems });
  }, [data, saveData]);

  return {
    data,
    loading,
    error,
    saving,
    saveData,
    saveField,
    addItem,
    updateItem,
    deleteItem,
  };
}
