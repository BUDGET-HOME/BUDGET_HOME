import { describe, expect, it } from "vitest";
import { normalizeState } from "./budget-service";
import { DEFAULT_STATE } from "./types";

describe("normalizeState (validation JSON import)", () => {
  it("retourne l'état par défaut pour une entrée invalide", () => {
    expect(normalizeState(null)).toEqual(DEFAULT_STATE);
    expect(normalizeState("string")).toEqual(DEFAULT_STATE);
    expect(normalizeState(42)).toEqual(DEFAULT_STATE);
  });

  it("accepte l'ancien format v6/v8 (immo à plat)", () => {
    const raw = {
      name1: "A",
      name2: "B",
      salary1: "2000",
      salary2: "1000",
      force5050: true,
      expenses: [{ id: 1, desc: "Loyer", amount: 800, freq: "monthly", category: "🏠 Logement", payer: "1" }],
      immoApport: 30000,
      immoRate: 3.5,
      immoInsurance: 0.3,
      immoDuration: 25,
      immoType: "neuf",
    };
    const s = normalizeState(raw);
    expect(s.name1).toBe("A");
    expect(s.force5050).toBe(true);
    expect(s.immo.immoApport).toBe(30000);
    expect(s.immo.immoType).toBe("neuf");
    expect(s.expenses.length).toBe(1);
  });

  it("filtre les dépenses invalides", () => {
    const raw = {
      expenses: [
        { desc: "", amount: 100 },
        { desc: "OK", amount: -5 },
        { desc: "Valide", amount: 50, freq: "annual", category: "✈️ Vacances", payer: "2" },
      ],
    };
    const s = normalizeState(raw);
    expect(s.expenses.length).toBe(1);
    expect(s.expenses[0].desc).toBe("Valide");
  });

  it("conserve les salaires numériques de l'ancien JSON", () => {
    const s = normalizeState({ salary1: 2300, salary2: 0 });
    expect(s.salary1).toBe("2300");
    expect(s.salary2).toBe("0");
  });

  it("laisse un salaire absent vide", () => {
    const s = normalizeState({ salary1: "1800" });
    expect(s.salary1).toBe("1800");
    expect(s.salary2).toBe("");
  });

  it("applique des valeurs par défaut sûres sur champs manquants", () => {
    const s = normalizeState({});
    expect(s.name1).toBe(DEFAULT_STATE.name1);
    expect(s.expenses).toEqual([]);
    expect(s.immo.immoDuration).toBe(20);
    expect(s.loan.loanPayer).toBe("shared");
  });

  it("retient le payeur du crédit", () => {
    expect(normalizeState({ loan: { loanPayer: "2" } }).loan.loanPayer).toBe("2");
  });
});
