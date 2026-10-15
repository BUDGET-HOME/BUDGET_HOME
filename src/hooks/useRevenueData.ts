"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { CompanyStatus } from "@/lib/launch";
import type { ServiceLine } from "@/lib/business";

export interface RevenueSimulatorData {
  status: CompanyStatus;
  services: ServiceLine[];
  expense: number;
  updatedAt: string;
  userId: string;
}

const DEFAULT_SERVICE: ServiceLine = { id: 1, name: "Prestation A", unitPrice: 500, unitsPerMonth: 4 };

const DEFAULT_DATA: Omit<RevenueSimulatorData, 'updatedAt' | 'userId'> = {
  status: "micro",
  services: [DEFAULT_SERVICE],
  expense: 300,
};

const TABLE_NAME = "revenue_simulator";

export function useRevenueData() {
  const [data, setData] = useState<RevenueSimulatorData | null>(null);
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
          console.error("Error fetching revenue data:", fetchError);
        }

        if (existingData) {
          setData({
            ...existingData,
            userId: user.id,
            status: existingData.status as CompanyStatus,
            services: existingData.services || DEFAULT_DATA.services,
            expense: existingData.expense || DEFAULT_DATA.expense,
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
            console.error("Error creating revenue data:", insertError);
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
  const saveData = useCallback(async (updates: Partial<Omit<RevenueSimulatorData, 'updatedAt' | 'userId'>>) => {
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
          console.error("Error updating revenue data:", updateError);
          setError("Erreur lors de la sauvegarde");
          setSaving(false);
          return false;
        }
      } else {
        const { error: insertError } = await supabase
          .from(TABLE_NAME)
          .insert([newData as any]);
        
        if (insertError) {
          console.error("Error inserting revenue data:", insertError);
          setError("Erreur lors de la sauvegarde");
          setSaving(false);
          return false;
        }
      }

      setData({
        ...newData,
        userId: user.id,
        status: (newData.status || DEFAULT_DATA.status) as CompanyStatus,
        services: newData.services || DEFAULT_DATA.services,
        expense: newData.expense || DEFAULT_DATA.expense,
        updatedAt: newData.updated_at || new Date().toISOString(),
      } as RevenueSimulatorData);
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
  const updateField = useCallback(async <K extends keyof Omit<RevenueSimulatorData, 'updatedAt' | 'userId'>>(
    field: K,
    value: RevenueSimulatorData[K]
  ) => {
    return saveData({ [field]: value } as Partial<Omit<RevenueSimulatorData, 'updatedAt' | 'userId'>>);
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
