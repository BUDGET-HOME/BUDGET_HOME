import { describe, expect, it } from "vitest";
import { arceCreditsByMonth, arceFromAre, calculateARE } from "./are";
import {
  occursInMonth,
  openingBalanceWithoutFirstRevenue,
  projectCashFlow,
  type CashFlowProjectionItem,
} from "./cash-flow";

const now = new Date(2026, 0, 31);

function item(partial: Partial<CashFlowProjectionItem> & Pick<CashFlowProjectionItem, "amount" | "type" | "frequency">): CashFlowProjectionItem {
  return {
    startDate: "2026-01-31",
    endDate: null,
    ...partial,
  };
}

describe("projectCashFlow", () => {
  it("répète une charge mensuelle même quand le jour de départ n'existe pas tous les mois", () => {
    const rows = projectCashFlow(
      [item({ amount: 150, type: "debit", frequency: "mensuel" })],
      0,
      now,
    );
    expect(rows).toHaveLength(12);
    expect(rows.map((row) => row.debits)).toEqual(Array(12).fill(150));
    expect(rows[1].balance).toBe(-300);
    expect(rows[11].balance).toBe(-1800);
  });

  it("n'ajoute pas le premier encaissement au solde d'ouverture", () => {
    const rows = projectCashFlow(
      [item({ amount: 8000, type: "credit", frequency: "mensuel", startDate: "2026-01-01" })],
      0,
      now,
    );
    expect(rows[0].credits).toBe(8000);
    expect(rows[0].balance).toBe(8000);
    expect(rows[0].balance).not.toBe(16000);
  });

  it("place un flux ponctuel sur son seul mois et un trimestriel tous les trois mois", () => {
    const rows = projectCashFlow(
      [
        item({ amount: 500, type: "credit", frequency: "ponctuel", startDate: "2026-03-02" }),
        item({ amount: 90, type: "debit", frequency: "trimestriel", startDate: "2026-01-15" }),
      ],
      100,
      now,
    );
    expect(rows[2].credits).toBe(500);
    expect(rows[0].credits).toBe(0);
    expect(rows.map((row) => row.debits)).toEqual([90, 0, 0, 90, 0, 0, 90, 0, 0, 90, 0, 0]);
    expect(rows[0].balance).toBe(10);
  });

  it("s'arrête à la date de fin", () => {
    const month = new Date(2026, 2, 1);
    expect(occursInMonth(item({ amount: 1, type: "debit", frequency: "mensuel", endDate: "2026-02-28" }), month)).toBe(false);
    expect(occursInMonth(item({ amount: 1, type: "debit", frequency: "mensuel", endDate: "2026-03-01" }), month)).toBe(true);
  });
});

describe("ARCE", () => {
  it("calcule l'aide depuis les paramètres ARE puis la verse en deux fois", () => {
    const are = calculateARE(3500, 0, 38, 12);
    const plan = arceFromAre(are);
    expect(plan.first + plan.second).toBe(plan.total);
    expect(plan.first).toBe(Math.round(plan.total / 2));
    const credits = arceCreditsByMonth(plan);
    expect(credits[0]).toBe(plan.first);
    expect(credits[6]).toBe(plan.second);
    expect(credits.filter((amount) => amount > 0)).toHaveLength(2);

    const rows = projectCashFlow([], 1000, now, 12, credits);
    expect(rows[0].balance).toBe(1000 + plan.first);
    expect(rows[5].balance).toBe(1000 + plan.first);
    expect(rows[6].balance).toBe(1000 + plan.total);
  });
});

describe("openingBalanceWithoutFirstRevenue", () => {
  it("retire le chiffre d'affaires qui avait été copié dans le solde initial", () => {
    expect(openingBalanceWithoutFirstRevenue(8640, 8640)).toBe(0);
  });

  it("conserve une trésorerie saisie à part", () => {
    expect(openingBalanceWithoutFirstRevenue(2500, 8640)).toBe(2500);
    expect(openingBalanceWithoutFirstRevenue(0, 8640)).toBe(0);
  });
});
