"use client";

import { useCallback } from "react";
import type { GanttTask } from "@/lib/gantt";
import { useEntrepriseContext } from "./useEntreprise";

export function useGanttData() {
  const { state, loaded, saving, update } = useEntrepriseContext();

  const saveData = useCallback(
    async (updates: { tasks?: GanttTask[] }) => {
      if (!updates.tasks) return true;
      update((prev) => ({ ...prev, gantt: { tasks: updates.tasks ?? prev.gantt.tasks } }));
      return true;
    },
    [update]
  );

  const saveField = useCallback(
    async (field: "tasks", value: GanttTask[]) => saveData({ [field]: value }),
    [saveData]
  );

  return {
    data: { tasks: state.gantt.tasks, updatedAt: "", userId: "" },
    loading: !loaded,
    error: null as string | null,
    saving,
    saveData,
    saveField,
  };
}
