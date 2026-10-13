import { describe, expect, it } from "vitest";
import { annuityPayment, computeLoanSummary, projectLoan } from "./loan";
import type { LoanSettings } from "./types";

const loan = (over: Partial<LoanSettings>): LoanSettings => ({
  capital: 200000,
  rate: 3.5,
  insuranceRate: 0.34,
  durationMonths: 240,
  monthlyPayment: 0,
  startDate: "",
  ...over,
});

describe("annuityPayment", () => {
  it("calcule la mensualité d'annuité", () => {
    const p = annuityPayment(200000, 3.5, 240);
    expect(p).toBeCloseTo(1159.92, -2);
  });

  it("gère un taux nul", () => {
    expect(annuityPayment(120000, 0, 240)).toBeCloseTo(500, 1);
  });
});

describe("computeLoanSummary", () => {
  it("utilise la mensualité fournie si présente", () => {
    const s = computeLoanSummary(loan({ monthlyPayment: 1200 }));
    const months = 240;
    const expectedInsurance = 200000 * (0.34 / 100 / 12) * months;
    const expectedInterest = 1200 * months - 200000 - expectedInsurance;
    expect(s.totalCost).toBeCloseTo(expectedInterest + expectedInsurance, 0);
  });

  it("calcule l'annuité si mensualité absente", () => {
    const s = computeLoanSummary(loan({ monthlyPayment: 0 }));
    expect(s.monthlyPrincipal + s.monthlyInterest).toBeCloseTo(
      annuityPayment(200000, 3.5, 240),
      -2
    );
  });

  it("rembourse tout après la durée (capital = 0)", () => {
    const start = new Date();
    start.setFullYear(start.getFullYear() - 21);
    const s = computeLoanSummary(
      loan({ startDate: start.toISOString().slice(0, 10) })
    );
    expect(s.remainingMonths).toBe(0);
    expect(s.remainingBalance).toBeLessThan(1);
    expect(s.endDate).toBe("Terminé 🎉");
  });

  it("compte les mois écoulés depuis la date de départ", () => {
    const start = new Date();
    start.setMonth(start.getMonth() - 12);
    const s = computeLoanSummary(
      loan({ startDate: start.toISOString().slice(0, 10) })
    );
    expect(s.remainingMonths).toBe(228);
    expect(s.progressPercent).toBeCloseTo(5, 0);
  });
});

describe("projectLoan", () => {
  it("solde le crédit plus vite avec une mensualité supplémentaire", () => {
    const base = projectLoan(loan({}), 200000, 240, 0);
    const fast = projectLoan(loan({}), 200000, 240, 200);
    expect(fast.monthsToPayoff).toBeLessThan(base.monthsToPayoff);
    expect(fast.payoffDate).not.toBeNull();
  });

  it("la somme du principal projeté rembourse le solde initial", () => {
    const { rows } = projectLoan(loan({}), 200000, 240, 0);
    const total = rows.reduce((acc, r) => acc + r.principal, 0);
    expect(total).toBeCloseTo(200000, 0);
  });

  it("génère une ligne par tranche de 12 mois", () => {
    const { rows } = projectLoan(
      loan({ durationMonths: 24, monthlyPayment: 9000 }),
      200000,
      24,
      0
    );
    expect(rows.length).toBe(2);
  });
});
