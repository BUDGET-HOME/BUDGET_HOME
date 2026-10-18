"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

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
  enableARCE: boolean;
  arceAmount: number;
  updatedAt: string;
  userId: string;
}

const DEFAULT_DATA: Omit<CashFlowData, 'updatedAt' | 'userId'> = {
  items: [],
  initialBalance: 0,
  enableARCE: false,
  arceAmount: 0,
};

const TABLE_NAME = "cash_flow_planner";

const mapFromDb = (dbData: any): CashFlowData => ({
  items: dbData.items || DEFAULT_DATA.items,
  initialBalance: dbData.initial_balance || DEFAULT_DATA.initialBalance,
  enableARCE: dbData.enable_arce ?? DEFAULT_DATA.enableARCE,
  arceAmount: dbData.arce_amount || DEFAULT_DATA.arceAmount,
  updatedAt: dbData.updated_at,
  userId: dbData.user_id,
});

const mapToDb = (data: Partial<Omit<CashFlowData, 'updatedAt' | 'userId'>> & { user_id?: string; updated_at?: string }): any => ({
  items: data.items,
  initial_balance: data.initialBalance,
  enable_arce: data.enableARCE,
  arce_amount: data.arceAmount,
  user_id: data.user_id,
  updated_at: data.updated_at,
});

export function useCashFlowData() {
  const [data, setData] = useState<CashFlowData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [isClient, setIsClient] = useState<boolean>(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setData({ ...DEFAULT_DATA, userId: "", updatedAt: new Date().toISOString() });
          setLoading(false);
          return;
        }

        const { data: existingData, error: fetchError } = await supabase
          .from(TABLE_NAME)
          .select("*")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false })
          .limit(1)
          .single();

        if (fetchError && fetchError.code !== "PGRST116") {
          console.error("Error fetching cash flow data:", fetchError);
          if (fetchError.code === "PGRST001" || fetchError.code === "404" || fetchError.message?.includes("relation")) {
            console.log("Cash flow table does not exist yet, using default data");
          }
        }

        if (existingData) {
          setData(mapFromDb(existingData));
        } else {
          const newData = {
            ...mapToDb(DEFAULT_DATA),
            user_id: user.id,
            updated_at: new Date().toISOString(),
          };
          const { error: insertError } = await supabase
            .from(TABLE_NAME)
            .insert([newData]);
          
          if (insertError) {
            console.error("Error creating cash flow data:", insertError);
            if (!insertError.message?.includes("relation") && !insertError.code?.includes("404")) {
              setError("Erreur lors de la création");
            }
          }
          setData({ ...DEFAULT_DATA, userId: user.id, updatedAt: new Date().toISOString() });
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        setError("Erreur inattendue");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isClient]);

  const saveData = useCallback(async (updates: Partial<Omit<CashFlowData, 'updatedAt' | 'userId'>>) => {
    if (!isClient) return false;
    
    try {
      setSaving(true);
      setError(null);
      
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError("Vous devez être connecté pour sauvegarder");
        setSaving(false);
        return false;
      }

      const currentData = data || { ...DEFAULT_DATA, userId: user.id, updatedAt: new Date().toISOString() };
      const mergedData = { ...currentData, ...updates };
      const dbData = mapToDb({
        ...mergedData,
        user_id: user.id,
        updated_at: new Date().toISOString(),
      });

      try {
        if (data?.userId === user.id) {
          const { error: updateError } = await supabase
            .from(TABLE_NAME)
            .update(dbData)
            .eq("user_id", user.id);
          
          if (updateError && !updateError.message?.includes("relation") && !updateError.code?.includes("404")) {
            console.error("Error updating cash flow data:", updateError);
            setError("Erreur lors de la sauvegarde");
            setSaving(false);
            return false;
          }
        } else {
          const { error: insertError } = await supabase
            .from(TABLE_NAME)
            .insert([dbData]);
          
          if (insertError && !insertError.message?.includes("relation") && !insertError.code?.includes("404")) {
            console.error("Error inserting cash flow data:", insertError);
            setError("Erreur lors de la sauvegarde");
            setSaving(false);
            return false;
          }
        }
      } catch (dbErr) {
        console.error("Database error:", dbErr);
        setError("Erreur lors de la sauvegarde");
        setSaving(false);
        return false;
      }

      setData({
        ...mergedData,
        userId: user.id,
        items: mergedData.items || DEFAULT_DATA.items,
        initialBalance: mergedData.initialBalance ?? DEFAULT_DATA.initialBalance,
        enableARCE: mergedData.enableARCE ?? DEFAULT_DATA.enableARCE,
        arceAmount: mergedData.arceAmount ?? DEFAULT_DATA.arceAmount,
        updatedAt: new Date().toISOString(),
      } as CashFlowData);
      return true;
    } catch (err) {
      console.error("Unexpected error saving:", err);
      setError("Erreur inattendue lors de la sauvegarde");
      setSaving(false);
      return false;
    } finally {
      setSaving(false);
    }
  }, [data, isClient]);

  const saveField = useCallback(async <K extends keyof Omit<CashFlowData, 'updatedAt' | 'userId'>>(
    field: K,
    value: CashFlowData[K]
  ) => {
    return saveData({ [field]: value } as Partial<Omit<CashFlowData, 'updatedAt' | 'userId'>>);
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
