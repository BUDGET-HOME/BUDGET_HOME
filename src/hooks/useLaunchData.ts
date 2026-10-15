"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { CompanyStatus } from "@/lib/launch";

export interface LaunchSimulatorData {
  status: CompanyStatus;
  grantMonthly: number;
  grantMonths: number;
  acre: boolean;
  contribution: number;
  needLow: number;
  needHigh: number;
  updatedAt: string;
  userId: string;
}

const DEFAULT_DATA: Omit<LaunchSimulatorData, 'updatedAt' | 'userId'> = {
  status: "micro",
  grantMonthly: 1000,
  grantMonths: 6,
  acre: true,
  contribution: 15000,
  needLow: 1500,
  needHigh: 2500,
};

const TABLE_NAME = "launch_simulator";

// Mapper les noms de colonnes snake_case vers camelCase
const mapFromDb = (dbData: any): LaunchSimulatorData => ({
  status: dbData.status as CompanyStatus,
  grantMonthly: dbData.grant_monthly,
  grantMonths: dbData.grant_months,
  acre: dbData.acre,
  contribution: dbData.contribution,
  needLow: dbData.need_low,
  needHigh: dbData.need_high,
  updatedAt: dbData.updated_at,
  userId: dbData.user_id,
});

// Mapper les noms de colonnes camelCase vers snake_case pour l'insert/update
const mapToDb = (data: Partial<Omit<LaunchSimulatorData, 'updatedAt' | 'userId'>> & { user_id?: string; updated_at?: string }): any => ({
  status: data.status,
  grant_monthly: data.grantMonthly,
  grant_months: data.grantMonths,
  acre: data.acre,
  contribution: data.contribution,
  need_low: data.needLow,
  need_high: data.needHigh,
  user_id: data.user_id,
  updated_at: data.updated_at,
});

export function useLaunchData() {
  const [data, setData] = useState<LaunchSimulatorData | null>(null);
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
          console.error("Error fetching launch data:", fetchError);
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
            console.error("Error creating launch data:", insertError);
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

  const saveData = useCallback(async (updates: Partial<Omit<LaunchSimulatorData, 'updatedAt' | 'userId'>>) => {
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

      // Vérifier si on a déjà un enregistrement
      if (data?.userId === user.id) {
        const { error: updateError } = await supabase
          .from(TABLE_NAME)
          .update(dbData)
          .eq("user_id", user.id);
        
        if (updateError) {
          console.error("Error updating launch data:", updateError);
          setError("Erreur lors de la sauvegarde");
          setSaving(false);
          return false;
        }
      } else {
        const { error: insertError } = await supabase
          .from(TABLE_NAME)
          .insert([dbData]);
        
        if (insertError) {
          console.error("Error inserting launch data:", insertError);
          setError("Erreur lors de la sauvegarde");
          setSaving(false);
          return false;
        }
      }

      setData({
        ...mergedData,
        userId: user.id,
        status: mergedData.status || DEFAULT_DATA.status,
        grantMonthly: mergedData.grantMonthly ?? DEFAULT_DATA.grantMonthly,
        grantMonths: mergedData.grantMonths ?? DEFAULT_DATA.grantMonths,
        acre: mergedData.acre ?? DEFAULT_DATA.acre,
        contribution: mergedData.contribution ?? DEFAULT_DATA.contribution,
        needLow: mergedData.needLow ?? DEFAULT_DATA.needLow,
        needHigh: mergedData.needHigh ?? DEFAULT_DATA.needHigh,
        updatedAt: new Date().toISOString(),
      });
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

  const updateField = useCallback(async <K extends keyof Omit<LaunchSimulatorData, 'updatedAt' | 'userId'>>(
    field: K,
    value: LaunchSimulatorData[K]
  ) => {
    return saveData({ [field]: value } as Partial<Omit<LaunchSimulatorData, 'updatedAt' | 'userId'>>);
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
