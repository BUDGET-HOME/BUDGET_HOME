import { describe, expect, it } from "vitest";
import {
  annuityPayment,
  buildSchedule,
  computeLoanSummary,
  computeTAEG,
  insuranceForMonth,
  loanFees,
  projectLoan,
} from "./loan";
import type { LoanSettings } from "./loan";

const realOffer = (over: Partial<LoanSettings> = {}): LoanSettings => ({
  capital: 200000,
  rate: 3.4,
  durationMonths: 300,
  monthlyPayment: 0,
  startDate: "",
  insuranceMode: "remaining",
  insuranceRate: 1.1,
  insuranceAvgMonthly: 0,
  guaranteeFees: 3192,
  brokerFees: 2500,
  fileFees: 1300,
  ...over,
});

describe("annuityPayment", () => {
  it("calcule la mensualité pour l'offre réelle (200k€, 3.4%, 300 mois)", () => {
    const p = annuityPayment(200000, 3.4, 300);
    expect(p).toBeGreaterThan(985);
    expect(p).toBeLessThan(1005);
  });

  it("gère un taux nul", () => {
    expect(annuityPayment(120000, 0, 240)).toBeCloseTo(500, 1);
  });
});

describe("assurance sur capital restant dû", () => {
  it("est dégressive : première cotisation > dernière cotisation", () => {
    const loan = realOffer();
    const first = insuranceForMonth(loan, loan.capital);
    expect(first).toBeCloseTo((200000 * 0.011) / 12, 2);
    const schedule = buildSchedule(loan);
    expect(schedule[0].insurance).toBeGreaterThan(
      schedule[schedule.length - 1].insurance
    );
  });

  it("permet de calibrer le taux pour cibler la cotisation moyenne de l'offre", () => {
    const loan = realOffer({ insuranceRate: 2.2 });
    const schedule = buildSchedule(loan);
    const avg = schedule.reduce((a, m) => a + m.insurance, 0) / schedule.length;
    expect(avg).toBeGreaterThan(150);
    expect(avg).toBeLessThan(220);
  });
});

describe("loanFees", () => {
  it("additionne les frais d'entrée", () => {
    expect(loanFees(realOffer())).toBe(3192 + 2500 + 1300);
  });
});

describe("buildSchedule", () => {
  it("solde exactement le capital sur la durée", () => {
    const schedule = buildSchedule(realOffer());
    expect(schedule.length).toBe(300);
    expect(schedule[schedule.length - 1].balance).toBeLessThan(0.01);
  });

  it("utilise la mensualité fournie si présente", () => {
    const schedule = buildSchedule(realOffer({ monthlyPayment: 1200 }));
    expect(schedule[0].payment).toBeCloseTo(1200, 2);
  });

  it("la somme du principal rembourse exactement le capital", () => {
    const schedule = buildSchedule(realOffer());
    const sum = schedule.reduce((a, m) => a + m.principal, 0);
    expect(sum).toBeCloseTo(200000, 2);
  });
});

describe("computeTAEG", () => {
  it("inclut frais et assurance : TAEG > taux débiteur", () => {
    const loan = realOffer();
    const taeg = computeTAEG(loan);
    expect(taeg).not.toBeNull();
    expect(taeg!).toBeGreaterThan(3.4);
    expect(taeg!).toBeLessThan(6);
  });

  it("sans frais ni assurance, TAEG ≈ taux débiteur", () => {
    const loan = realOffer({
      insuranceRate: 0,
      guaranteeFees: 0,
      brokerFees: 0,
      fileFees: 0,
    });
    const taeg = computeTAEG(loan);
    expect(taeg).toBeCloseTo(3.4, 1);
  });
});

describe("computeLoanSummary", () => {
  it("compte les mois écoulés et le restant dû", () => {
    const start = new Date();
    start.setMonth(start.getMonth() - 12);
    const s = computeLoanSummary(
      realOffer({ startDate: start.toISOString().slice(0, 7) })
    );
    expect(s.elapsedMonths).toBe(12);
    expect(s.remainingMonths).toBe(288);
    expect(s.remainingBalance).toBeLessThan(200000);
    expect(s.progressPercent).toBeCloseTo(4, 0);
  });

  it("affiche Terminé quand tout est remboursé", () => {
    const start = new Date();
    start.setFullYear(start.getFullYear() - 26);
    const s = computeLoanSummary(
      realOffer({ startDate: start.toISOString().slice(0, 7) })
    );
    expect(s.remainingMonths).toBe(0);
    expect(s.endDate).toBe("Terminé 🎉");
  });

  it("coût total = intérêts + assurance + frais", () => {
    const s = computeLoanSummary(realOffer());
    expect(s.totalCost).toBeCloseTo(
      s.totalInterest + s.totalInsurance + s.totalFees,
      2
    );
  });
});

describe("projectLoan (remboursement anticipé)", () => {
  it("solder plus vite et économiser des intérêts", () => {
    const base = projectLoan(realOffer(), 200000, 300, 0);
    const fast = projectLoan(realOffer(), 200000, 300, 200);
    expect(fast.monthsToPayoff).toBeLessThan(base.monthsToPayoff);
    expect(fast.payoffDate).not.toBeNull();
    expect(fast.interestSaved).toBeGreaterThan(0);
  });

  it("la somme du principal rembourse le solde de départ", () => {
    const { rows } = projectLoan(realOffer(), 200000, 300, 0);
    const total = rows.reduce((a, r) => a + r.principal, 0);
    expect(total).toBeCloseTo(200000, 0);
  });
});
