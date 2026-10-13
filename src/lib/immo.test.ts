import { describe, expect, it } from "vitest";
import { calculateImmo, generateAmortization, monthsToSave } from "./immo";
import type { Expense } from "./types";

const baseInput = {
  salary1: 2000,
  salary2: 1000,
  force5050: false,
  apport: 20000,
  ratePercent: 3.8,
  insurancePercent: 0.34,
  durationYears: 20,
  type: "ancien" as const,
};

const rentExpense: Expense = {
  id: 1,
  desc: "Loyer",
  amount: 800,
  freq: "monthly",
  category: "🏠 Logement",
  payer: "1",
};

describe("calculateImmo", () => {
  it("plafonne la mensualité au minimum (35% vs reste à vivre)", () => {
    const r = calculateImmo({ ...baseInput, expenses: [] });
    expect(r.maxMonthlyBank).toBeCloseTo(3000 * 0.35);
    expect(r.maxMonthlyReal).toBe(3000);
    expect(r.safeMonthlyPayment).toBe(1050);
    expect(r.limitedByRestToLive).toBe(false);
  });

  it("est limité par le reste à vivre quand les charges sont élevées", () => {
    const r = calculateImmo({ ...baseInput, expenses: [rentExpense] });
    expect(r.currentAnnualRent).toBe(9600);
    expect(r.maxMonthlyReal).toBeCloseTo(3000 - 0);
    expect(r.safeMonthlyPayment).toBeLessThanOrEqual(r.maxMonthlyBank);
  });

  it("calcule le montant empruntable avec intérêts et assurance", () => {
    const r = calculateImmo({ ...baseInput, expenses: [] });
    const n = 240;
    const monthlyRate = 0.038 / 12;
    const annuity = monthlyRate / (1 - Math.pow(1 + monthlyRate, -n));
    const expectedLoan = 1050 / (annuity + 0.0034 / 12);
    expect(r.loanAmount).toBeCloseTo(expectedLoan, -2);
  });

  it("applique ~8% de frais de notaire pour l'ancien", () => {
    const r = calculateImmo({ ...baseInput, expenses: [] });
    expect(r.notaryRate).toBe(0.08);
    expect(r.netSellerPrice + r.notaryFees).toBeCloseTo(r.totalProject);
  });

  it("applique ~2.5% de frais de notaire pour le neuf", () => {
    const r = calculateImmo({ ...baseInput, expenses: [], type: "neuf" });
    expect(r.notaryRate).toBe(0.025);
  });

  it("gère un taux d'intérêt nul", () => {
    const r = calculateImmo({ ...baseInput, expenses: [], ratePercent: 0 });
    expect(r.loanAmount).toBeGreaterThan(0);
    expect(r.totalCreditInterest).toBeCloseTo(0, 0);
    expect(r.totalCreditCost).toBeCloseTo(r.totalInsuranceCost, 0);
  });
});

describe("generateAmortization", () => {
  it("génère autant de lignes que d'années", () => {
    const rows = generateAmortization(200000, 0.003, 240, 50);
    expect(rows.length).toBe(20);
    expect(rows[0].year).toBe(1);
    expect(rows[19].year).toBe(20);
  });

  it("la somme du principal rembourse le capital", () => {
    const principal = 200000;
    const rows = generateAmortization(principal, 0.003, 240, 50);
    const totalPrincipal = rows.reduce((acc, r) => acc + r.principal, 0);
    expect(totalPrincipal).toBeCloseTo(principal, 0);
  });

  it("le restant dû tend vers zéro", () => {
    const rows = generateAmortization(200000, 0.003, 240, 50);
    expect(rows[rows.length - 1].balance).toBeLessThan(1);
  });
});

describe("monthsToSave", () => {
  it("calcule la durée d'épargne", () => {
    expect(monthsToSave(12000, 500)).toBe(24);
  });

  it("retourne null si l'épargne est nulle ou négative", () => {
    expect(monthsToSave(12000, 0)).toBeNull();
    expect(monthsToSave(0, 500)).toBeNull();
  });
});
