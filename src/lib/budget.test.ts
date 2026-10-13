import { describe, expect, it } from "vitest";
import {
  computeBalance,
  computeRatio,
  computeVerdict,
  summarizeExpenses,
} from "./budget";
import type { Expense } from "./types";

const exp = (over: Partial<Expense>): Expense => ({
  id: 1,
  desc: "Test",
  amount: 100,
  freq: "monthly",
  category: "📦 Autre",
  payer: "1",
  ...over,
});

describe("computeRatio", () => {
  it("répartit proportionnellement aux salaires", () => {
    const r = computeRatio(2000, 1000, false);
    expect(r.ratio1).toBeCloseTo(2 / 3);
    expect(r.ratio2).toBeCloseTo(1 / 3);
    expect(r.forced).toBe(false);
  });

  it("force le 50/50 quand demandé", () => {
    const r = computeRatio(2000, 1000, true);
    expect(r.ratio1).toBe(0.5);
    expect(r.ratio2).toBe(0.5);
    expect(r.forced).toBe(true);
  });

  it("retourne 50/50 si les salaires sont nuls", () => {
    const r = computeRatio(0, 0, false);
    expect(r.ratio1).toBe(0.5);
    expect(r.forced).toBe(true);
  });
});

describe("summarizeExpenses", () => {
  it("annualise les dépenses mensuelles", () => {
    const s = summarizeExpenses([exp({ amount: 100, freq: "monthly" })]);
    expect(s.totalAnnual).toBe(1200);
  });

  it("garde les dépenses annuelles telles quelles", () => {
    const s = summarizeExpenses([exp({ amount: 500, freq: "annual" })]);
    expect(s.totalAnnual).toBe(500);
  });

  it("répartit par payeur et catégorie", () => {
    const s = summarizeExpenses([
      exp({ amount: 100, payer: "1", category: "🏠 Logement" }),
      exp({ id: 2, amount: 50, payer: "2", category: "⚡ Énergie", freq: "annual" }),
    ]);
    expect(s.paidAnnual1).toBe(1200);
    expect(s.paidAnnual2).toBe(50);
    expect(s.categoryTotals["🏠 Logement"]).toBe(1200);
    expect(s.currentAnnualRent).toBe(1200);
  });
});

describe("computeBalance", () => {
  it("calcule la capacité d'épargne mensuelle", () => {
    const b = computeBalance(2000, 1000, [exp({ amount: 500 })], "monthly", false);
    expect(b.displayIncome).toBe(3000);
    expect(b.displayTotal).toBe(500);
    expect(b.savingsCapacity).toBe(2500);
  });

  it("calcule le solde du payeur 1", () => {
    const b = computeBalance(2000, 1000, [exp({ amount: 300, payer: "1" })], "monthly", false);
    expect(b.shouldPay1).toBeCloseTo(300 * (2 / 3));
    expect(b.balance1).toBeCloseTo(300 - 300 * (2 / 3));
  });

  it("respecte le mode 50/50 forcé", () => {
    const b = computeBalance(2000, 1000, [exp({ amount: 300, payer: "1" })], "monthly", true);
    expect(b.shouldPay1).toBe(150);
    expect(b.balance1).toBe(150);
  });
});

describe("computeVerdict", () => {
  it("retourne vide sans dépenses", () => {
    expect(computeVerdict(0, 0, "A", "B").status).toBe("empty");
  });

  it("retourne équilibré si écart < 1 €", () => {
    expect(computeVerdict(0.5, 1200, "A", "B").status).toBe("balanced");
  });

  it("identifie le débiteur et le créancier", () => {
    const v = computeVerdict(100, 1200, "A", "B");
    expect(v.status).toBe("debt");
    expect(v.debtor).toBe("B");
    expect(v.creditor).toBe("A");
    expect(v.amount).toBe(100);
  });

  it("inverse les rôles si le solde est négatif", () => {
    const v = computeVerdict(-100, 1200, "A", "B");
    expect(v.debtor).toBe("A");
    expect(v.creditor).toBe("B");
  });
});

describe("computeBalance avec crédit maison", () => {
  const loan = {
    capital: 266000,
    rate: 3.4,
    durationMonths: 300,
    monthlyPayment: 1518.88,
    offeredTaeg: 4.2,
    startDate: "",
    insuranceMode: "remaining" as const,
    insuranceRate: 1.3267,
    insuranceAvgMonthly: 0,
    guaranteeFees: 3192,
    brokerFees: 2500,
    fileFees: 1300,
  };

  it("inclut la mensualité du prêt dans le total mensuel", () => {
    const without = computeBalance(2000, 1000, [], "monthly", false);
    const withLoan = computeBalance(2000, 1000, [], "monthly", false, "separe", loan);
    expect(withLoan.displayTotal).toBeCloseTo(1518.88, 1);
    expect(withLoan.savingsCapacity).toBeCloseTo(3000 - 1518.88, 1);
    expect(withLoan.displayTotal).toBeGreaterThan(without.displayTotal);
  });

  it("sans prêt, le total ne change pas", () => {
    const without = computeBalance(2000, 1000, [], "monthly", false);
    expect(without.displayTotal).toBe(0);
  });

  it("mode commun force le ratio 50/50", () => {
    const b = computeBalance(2000, 1000, [exp({ amount: 100, payer: "1" })], "monthly", false, "commun");
    expect(b.shouldPay1).toBeCloseTo(50, 0);
  });
});
