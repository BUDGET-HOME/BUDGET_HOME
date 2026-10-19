"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient, getOptionalUser } from "@/lib/supabase/client";
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

// Mapper les noms de colonnes snake_case vers camelCase
const mapFromDb = (dbData: any): RevenueSimulatorData => ({
  status: dbData.status as CompanyStatus,
  services: dbData.services || DEFAULT_DATA.services,
  expense: dbData.expense,
  updatedAt: dbData.updated_at,
  userId: dbData.user_id,
});

// Mapper les noms de colonnes camelCase vers snake_case pour l'insert/update
const mapToDb = (data: Partial<Omit<RevenueSimulatorData, 'updatedAt' | 'userId'>> & { user_id?: string; updated_at?: string }): any => ({
  status: data.status,
  services: data.services,
  expense: data.expense,
  user_id: data.user_id,
  updated_at: data.updated_at,
});

export function useRevenueData() {
  const [data, setData] = useState<RevenueSimulatorData | null>(null);
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
        
        const user = await getOptionalUser();
        
        if (!user) {
          setData({ ...DEFAULT_DATA, userId: "", updatedAt: new Date().toISOString() });
          setLoading(false);
          return;
        }

        const supabase = createClient();
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

  // Sauvegarde manuelle - à appeler explicitement
  const saveData = useCallback(async (updates: Partial<Omit<RevenueSimulatorData, 'updatedAt' | 'userId'>>) => {
    if (!isClient) return false;
    
    try {
      setSaving(true);
      setError(null);
      
      const user = await getOptionalUser();
      
      if (!user) {
        setError("Vous devez être connecté pour sauvegarder");
        setSaving(false);
        return false;
      }

      const supabase = createClient();
      const currentData = data || { ...DEFAULT_DATA, userId: user.id, updatedAt: new Date().toISOString() };
      const mergedData = { ...currentData, ...updates };
      const dbData = mapToDb({
        ...mergedData,
        user_id: user.id,
        updated_at: new Date().toISOString(),
      });

      if (data?.userId === user.id) {
        const { error: updateError } = await supabase
          .from(TABLE_NAME)
          .update(dbData)
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
          .insert([dbData]);
        
        if (insertError) {
          console.error("Error inserting revenue data:", insertError);
          setError("Erreur lors de la sauvegarde");
          setSaving(false);
          return false;
        }
      }

      setData({
        ...mergedData,
        userId: user.id,
        status: (mergedData.status || DEFAULT_DATA.status) as CompanyStatus,
        services: mergedData.services || DEFAULT_DATA.services,
        expense: mergedData.expense ?? DEFAULT_DATA.expense,
        updatedAt: new Date().toISOString(),
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

  // Sauvegarde un champ spécifique
  const saveField = useCallback(async <K extends keyof Omit<RevenueSimulatorData, 'updatedAt' | 'userId'>>(
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
    saveField,
  };
}
