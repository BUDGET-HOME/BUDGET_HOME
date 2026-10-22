import { describe, expect, it } from "vitest";
import {
  freelanceFromRecord,
  legacyEntrepriseRows,
  normalizeEntreprise,
  toEntrepriseBackup,
  withLocalCashFlowIfEmpty,
} from "./entreprise-state";

describe("état entreprise", () => {
  it("conserve un montant à zéro et un booléen faux", () => {
    const state = normalizeEntreprise({
      freelance: { tjm: 0, days: 0, acre: false, salaryBonus: 0 },
      gantt: { tasks: [] },
      cashFlow: { initialBalance: 0, items: [] },
    });
    expect(state.freelance.tjm).toBe(0);
    expect(state.freelance.days).toBe(0);
    expect(state.freelance.acre).toBe(false);
    expect(state.freelance.salaryBonus).toBe(0);
    expect(state.freelance.costRetirement).toBe(300);
    expect(state.gantt.tasks).toEqual([]);
  });

  it("relit une ancienne ligne snake_case", () => {
    const freelance = freelanceFromRecord({
      tjm: 0,
      cost_retirement: 12,
      acre: false,
      user_id: "secret",
    });
    expect(freelance.tjm).toBe(0);
    expect(freelance.costRetirement).toBe(12);
    expect(freelance.acre).toBe(false);

    const migrated = legacyEntrepriseRows(
      { tjm: 510, cost_meals: 0, updated_at: "2026-01-01T00:00:00.000Z", id: "1" },
      { tasks: [{ id: "a", name: "Statuts", startMonth: 2, durationMonths: 1, category: "admin", done: true }] }
    );
    expect(migrated?.freelance.tjm).toBe(510);
    expect(migrated?.freelance.costMeals).toBe(0);
    expect(migrated?.gantt.tasks[0].name).toBe("Statuts");
    expect(migrated?.gantt.tasks[0].done).toBe(true);
  });

  it("complète la trésorerie locale seulement si le compte est vide", () => {
    const server = normalizeEntreprise({ cashFlow: { initialBalance: 0, items: [] } });
    const merged = withLocalCashFlowIfEmpty(server, {
      initialBalance: 40,
      items: [
        {
          id: "1",
          label: "Loyer",
          amount: 100,
          type: "debit",
          frequency: "mensuel",
          startDate: "2026-01-01",
          endDate: null,
          category: "Loyer",
          notes: "",
        },
      ],
    });
    expect(merged.changed).toBe(true);
    expect(merged.state.cashFlow.initialBalance).toBe(40);

    const kept = withLocalCashFlowIfEmpty(
      { ...server, cashFlow: { ...server.cashFlow, initialBalance: 5 } },
      merged.state.cashFlow
    );
    expect(kept.changed).toBe(false);
    expect(kept.state.cashFlow.initialBalance).toBe(5);
  });

  it("réexporte un fichier entreprise sans perdre un zéro", () => {
    const state = normalizeEntreprise({ freelance: { tjm: 0, acre: false } });
    const backup = toEntrepriseBackup(state, "2026-10-19T00:00:00.000Z");
    expect(backup.kind).toBe("budget-home-entreprise");
    expect(backup.freelance).toMatchObject({ tjm: 0, acre: false });
    const again = normalizeEntreprise(backup);
    expect(again.freelance.tjm).toBe(0);
    expect(again.freelance.acre).toBe(false);
  });

  it("conserve les paramètres ARE et les dates", () => {
    const state = normalizeEntreprise({
      freelance: {
        areWorkedDays: 400,
        contractEndDate: "2024-05-01",
        arceSecondPayment: false,
        arceConversion: true,
        areInactivityDays: 0,
      },
    });
    const backup = toEntrepriseBackup(state, "2026-10-21T00:00:00.000Z");
    expect(backup.freelance).toMatchObject({
      are_worked_days: 400,
      contract_end_date: "2024-05-01",
      arce_second_payment: false,
      arce_conversion: true,
      are_inactivity_days: 0,
    });
    const again = normalizeEntreprise(backup);
    expect(again.freelance.areWorkedDays).toBe(400);
    expect(again.freelance.contractEndDate).toBe("2024-05-01");
    expect(again.freelance.arceSecondPayment).toBe(false);
    expect(again.freelance.arceConversion).toBe(true);
    expect(again.freelance.activityStartDate).toBe("");
  });
});
