"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { DEFAULT_TASKS, type GanttTask } from "@/lib/gantt";

export interface GanttSimulatorData {
  tasks: GanttTask[];
  updatedAt: string;
  userId: string;
}

const DEFAULT_DATA: Omit<GanttSimulatorData, 'updatedAt' | 'userId'> = {
  tasks: DEFAULT_TASKS,
};

const TABLE_NAME = "gantt_simulator";

// Mapper les noms de colonnes snake_case vers camelCase
const mapFromDb = (dbData: any): GanttSimulatorData => ({
  tasks: dbData.tasks || DEFAULT_DATA.tasks,
  updatedAt: dbData.updated_at,
  userId: dbData.user_id,
});

// Mapper les noms de colonnes camelCase vers snake_case pour l'insert/update
const mapToDb = (data: Partial<Omit<GanttSimulatorData, 'updatedAt' | 'userId'>> & { user_id?: string; updated_at?: string }): any => ({
  tasks: data.tasks,
  user_id: data.user_id,
  updated_at: data.updated_at,
});

export function useGanttData() {
  const [data, setData] = useState<GanttSimulatorData | null>(null);
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
          console.error("Error fetching gantt data:", fetchError);
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
            console.error("Error creating gantt data:", insertError);
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
  const saveData = useCallback(async (updates: Partial<Omit<GanttSimulatorData, 'updatedAt' | 'userId'>>) => {
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

      if (data?.userId === user.id) {
        const { error: updateError } = await supabase
          .from(TABLE_NAME)
          .update(dbData)
          .eq("user_id", user.id);
        
        if (updateError) {
          console.error("Error updating gantt data:", updateError);
          setError("Erreur lors de la sauvegarde");
          setSaving(false);
          return false;
        }
      } else {
        const { error: insertError } = await supabase
          .from(TABLE_NAME)
          .insert([dbData]);
        
        if (insertError) {
          console.error("Error inserting gantt data:", insertError);
          setError("Erreur lors de la sauvegarde");
          setSaving(false);
          return false;
        }
      }

      setData({
        ...mergedData,
        userId: user.id,
        tasks: mergedData.tasks || DEFAULT_DATA.tasks,
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

  // Sauvegarde un champ spécifique
  const saveField = useCallback(async <K extends keyof Omit<GanttSimulatorData, 'updatedAt' | 'userId'>>(
    field: K,
    value: GanttSimulatorData[K]
  ) => {
    return saveData({ [field]: value } as Partial<Omit<GanttSimulatorData, 'updatedAt' | 'userId'>>);
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
