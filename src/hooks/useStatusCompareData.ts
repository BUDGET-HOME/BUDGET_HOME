"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export interface StatusCompareData {
  revenue: number;
  expense: number;
  updatedAt: string;
  userId: string;
}

const DEFAULT_DATA: Omit<StatusCompareData, 'updatedAt' | 'userId'> = {
  revenue: 60000,
  expense: 500,
};

const TABLE_NAME = "status_compare_simulator";

export function useStatusCompareData() {
  const [data, setData] = useState<StatusCompareData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [isClient, setIsClient] = useState<boolean>(false);

  // Attendre d'être côté client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Charger les données depuis Supabase
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
          console.error("Error fetching status compare data:", fetchError);
        }

        if (existingData) {
          setData({
            ...existingData,
            userId: user.id,
            revenue: existingData.revenue || DEFAULT_DATA.revenue,
            expense: existingData.expense || DEFAULT_DATA.expense,
            updatedAt: existingData.updatedAt || new Date().toISOString(),
          });
        } else {
          const newData = { 
            ...DEFAULT_DATA, 
            user_id: user.id, 
            updated_at: new Date().toISOString() 
          };
          const { error: insertError } = await supabase
            .from(TABLE_NAME)
            .insert([newData]);
          
          if (insertError) {
            console.error("Error creating status compare data:", insertError);
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

  // Sauvegarder les données
  const saveData = useCallback(async (updates: Partial<Omit<StatusCompareData, 'updatedAt' | 'userId'>>) => {
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

      const newData = {
        ...data,
        ...updates,
        user_id: user.id,
        updated_at: new Date().toISOString(),
      };

      // Vérifier si on a déjà un enregistrement
      if (data?.userId === user.id) {
        const { error: updateError } = await supabase
          .from(TABLE_NAME)
          .update(newData as any)
          .eq("user_id", user.id);
        
        if (updateError) {
          console.error("Error updating status compare data:", updateError);
          setError("Erreur lors de la sauvegarde");
          setSaving(false);
          return false;
        }
      } else {
        const { error: insertError } = await supabase
          .from(TABLE_NAME)
          .insert([newData as any]);
        
        if (insertError) {
          console.error("Error inserting status compare data:", insertError);
          setError("Erreur lors de la sauvegarde");
          setSaving(false);
          return false;
        }
      }

      setData({
        ...newData,
        userId: user.id,
        revenue: newData.revenue || DEFAULT_DATA.revenue,
        expense: newData.expense || DEFAULT_DATA.expense,
        updatedAt: newData.updated_at || newData.updatedAt || new Date().toISOString(),
      } as StatusCompareData);
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

  // Mettre à jour un champ spécifique
  const updateField = useCallback(async <K extends keyof Omit<StatusCompareData, 'updatedAt' | 'userId'>>(
    field: K,
    value: StatusCompareData[K]
  ) => {
    return saveData({ [field]: value } as Partial<Omit<StatusCompareData, 'updatedAt' | 'userId'>>);
  }, [saveData]);

  return {
    data,
    loading,
    error,
    saving,
    saveData,
    updateField,
  };
}
