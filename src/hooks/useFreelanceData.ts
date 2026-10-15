"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export interface FreelanceSimulatorData {
  // Status & Facturation
  status: string;
  tjm: number;
  days: number;
  
  // Charges & Investissements
  costRetirement: number;
  costLld: number;
  costFuel: number;
  costMutuelle: number;
  costBankIns: number;
  costAccountant: number;
  pctPortage: number;
  costMeals: number;
  costTelecom: number;
  costTech: number;
  
  // Paramètres Sociaux & Famille
  acre: boolean;
  fiscalParts: number;
  areToggle: boolean;
  salaryGross: number;
  salaryBonus: number;
  salaryMonths: number;
  userAge: number;
  
  // Metadata
  updatedAt: string;
  userId: string;
}

const DEFAULT_DATA: Omit<FreelanceSimulatorData, 'updatedAt' | 'userId'> = {
  status: "auto",
  tjm: 480,
  days: 18,
  costRetirement: 300,
  costLld: 450,
  costFuel: 150,
  costMutuelle: 80,
  costBankIns: 45,
  costAccountant: 150,
  pctPortage: 7,
  costMeals: 200,
  costTelecom: 50,
  costTech: 50,
  acre: true,
  fiscalParts: 1,
  areToggle: false,
  salaryGross: 3500,
  salaryBonus: 0,
  salaryMonths: 12,
  userAge: 35,
};

const TABLE_NAME = "freelance_simulator";

// Mapper les noms de colonnes snake_case vers camelCase
const mapFromDb = (dbData: any): FreelanceSimulatorData => ({
  status: dbData.status || DEFAULT_DATA.status,
  tjm: dbData.tjm || DEFAULT_DATA.tjm,
  days: dbData.days || DEFAULT_DATA.days,
  costRetirement: dbData.cost_retirement || DEFAULT_DATA.costRetirement,
  costLld: dbData.cost_lld || DEFAULT_DATA.costLld,
  costFuel: dbData.cost_fuel || DEFAULT_DATA.costFuel,
  costMutuelle: dbData.cost_mutuelle || DEFAULT_DATA.costMutuelle,
  costBankIns: dbData.cost_bank_ins || DEFAULT_DATA.costBankIns,
  costAccountant: dbData.cost_accountant || DEFAULT_DATA.costAccountant,
  pctPortage: dbData.pct_portage || DEFAULT_DATA.pctPortage,
  costMeals: dbData.cost_meals || DEFAULT_DATA.costMeals,
  costTelecom: dbData.cost_telecom || DEFAULT_DATA.costTelecom,
  costTech: dbData.cost_tech || DEFAULT_DATA.costTech,
  acre: dbData.acre ?? DEFAULT_DATA.acre,
  fiscalParts: dbData.fiscal_parts || DEFAULT_DATA.fiscalParts,
  areToggle: dbData.are_toggle ?? DEFAULT_DATA.areToggle,
  salaryGross: dbData.salary_gross || DEFAULT_DATA.salaryGross,
  salaryBonus: dbData.salary_bonus || DEFAULT_DATA.salaryBonus,
  salaryMonths: dbData.salary_months || DEFAULT_DATA.salaryMonths,
  userAge: dbData.user_age || DEFAULT_DATA.userAge,
  updatedAt: dbData.updated_at || new Date().toISOString(),
  userId: dbData.user_id,
});

// Mapper les noms de colonnes camelCase vers snake_case pour l'insert/update
const mapToDb = (data: Partial<FreelanceSimulatorData> & { user_id?: string; updated_at?: string }): any => ({
  status: data.status,
  tjm: data.tjm,
  days: data.days,
  cost_retirement: data.costRetirement,
  cost_lld: data.costLld,
  cost_fuel: data.costFuel,
  cost_mutuelle: data.costMutuelle,
  cost_bank_ins: data.costBankIns,
  cost_accountant: data.costAccountant,
  pct_portage: data.pctPortage,
  cost_meals: data.costMeals,
  cost_telecom: data.costTelecom,
  cost_tech: data.costTech,
  acre: data.acre,
  fiscal_parts: data.fiscalParts,
  are_toggle: data.areToggle,
  salary_gross: data.salaryGross,
  salary_bonus: data.salaryBonus,
  salary_months: data.salaryMonths,
  user_age: data.userAge,
  user_id: data.user_id,
  updated_at: data.updated_at,
});

export function useFreelanceData() {
  const [data, setData] = useState<FreelanceSimulatorData | null>(null);
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
          console.error("Error fetching freelance data:", fetchError);
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
            console.error("Error creating freelance data:", insertError);
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
  const saveData = useCallback(async (updates: Partial<Omit<FreelanceSimulatorData, 'updatedAt' | 'userId'>>) => {
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
          console.error("Error updating freelance data:", updateError);
          setError("Erreur lors de la sauvegarde");
          setSaving(false);
          return false;
        }
      } else {
        const { error: insertError } = await supabase
          .from(TABLE_NAME)
          .insert([dbData]);
        
        if (insertError) {
          console.error("Error inserting freelance data:", insertError);
          setError("Erreur lors de la sauvegarde");
          setSaving(false);
          return false;
        }
      }

      setData(mapFromDb(dbData));
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
  const saveField = useCallback(async <K extends keyof Omit<FreelanceSimulatorData, 'updatedAt' | 'userId'>>(
    field: K,
    value: FreelanceSimulatorData[K]
  ) => {
    return saveData({ [field]: value } as Partial<Omit<FreelanceSimulatorData, 'updatedAt' | 'userId'>>);
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
