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

export function useFreelanceData() {
  const [data, setData] = useState<FreelanceSimulatorData | null>(null);
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
          console.error("Error fetching freelance data:", fetchError);
        }

        if (existingData) {
          setData({
            ...existingData,
            userId: user.id,
            status: existingData.status || DEFAULT_DATA.status,
            tjm: existingData.tjm || DEFAULT_DATA.tjm,
            days: existingData.days || DEFAULT_DATA.days,
            costRetirement: existingData.costRetirement || DEFAULT_DATA.costRetirement,
            costLld: existingData.costLld || DEFAULT_DATA.costLld,
            costFuel: existingData.costFuel || DEFAULT_DATA.costFuel,
            costMutuelle: existingData.costMutuelle || DEFAULT_DATA.costMutuelle,
            costBankIns: existingData.costBankIns || DEFAULT_DATA.costBankIns,
            costAccountant: existingData.costAccountant || DEFAULT_DATA.costAccountant,
            pctPortage: existingData.pctPortage || DEFAULT_DATA.pctPortage,
            costMeals: existingData.costMeals || DEFAULT_DATA.costMeals,
            costTelecom: existingData.costTelecom || DEFAULT_DATA.costTelecom,
            costTech: existingData.costTech || DEFAULT_DATA.costTech,
            acre: existingData.acre ?? DEFAULT_DATA.acre,
            fiscalParts: existingData.fiscalParts || DEFAULT_DATA.fiscalParts,
            areToggle: existingData.areToggle ?? DEFAULT_DATA.areToggle,
            salaryGross: existingData.salaryGross || DEFAULT_DATA.salaryGross,
            salaryBonus: existingData.salaryBonus || DEFAULT_DATA.salaryBonus,
            salaryMonths: existingData.salaryMonths || DEFAULT_DATA.salaryMonths,
            userAge: existingData.userAge || DEFAULT_DATA.userAge,
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

  // Sauvegarder les données
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
          console.error("Error updating freelance data:", updateError);
          setError("Erreur lors de la sauvegarde");
          setSaving(false);
          return false;
        }
      } else {
        const { error: insertError } = await supabase
          .from(TABLE_NAME)
          .insert([newData as any]);
        
        if (insertError) {
          console.error("Error inserting freelance data:", insertError);
          setError("Erreur lors de la sauvegarde");
          setSaving(false);
          return false;
        }
      }

      setData({
        ...newData,
        userId: user.id,
        status: newData.status || DEFAULT_DATA.status,
        tjm: newData.tjm || DEFAULT_DATA.tjm,
        days: newData.days || DEFAULT_DATA.days,
        costRetirement: newData.costRetirement || DEFAULT_DATA.costRetirement,
        costLld: newData.costLld || DEFAULT_DATA.costLld,
        costFuel: newData.costFuel || DEFAULT_DATA.costFuel,
        costMutuelle: newData.costMutuelle || DEFAULT_DATA.costMutuelle,
        costBankIns: newData.costBankIns || DEFAULT_DATA.costBankIns,
        costAccountant: newData.costAccountant || DEFAULT_DATA.costAccountant,
        pctPortage: newData.pctPortage || DEFAULT_DATA.pctPortage,
        costMeals: newData.costMeals || DEFAULT_DATA.costMeals,
        costTelecom: newData.costTelecom || DEFAULT_DATA.costTelecom,
        costTech: newData.costTech || DEFAULT_DATA.costTech,
        acre: newData.acre ?? DEFAULT_DATA.acre,
        fiscalParts: newData.fiscalParts || DEFAULT_DATA.fiscalParts,
        areToggle: newData.areToggle ?? DEFAULT_DATA.areToggle,
        salaryGross: newData.salaryGross || DEFAULT_DATA.salaryGross,
        salaryBonus: newData.salaryBonus || DEFAULT_DATA.salaryBonus,
        salaryMonths: newData.salaryMonths || DEFAULT_DATA.salaryMonths,
        userAge: newData.userAge || DEFAULT_DATA.userAge,
        updatedAt: newData.updated_at || new Date().toISOString(),
      } as FreelanceSimulatorData);
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
  const updateField = useCallback(async <K extends keyof Omit<FreelanceSimulatorData, 'updatedAt' | 'userId'>>(
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
    updateField,
  };
}
