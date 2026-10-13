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

// Chiffres réels de l'offre n° 09116747 :
// capital 266 000 €, 300 mois, taux débiteur 3,400 %, versement constant
// 1 518,88 € assurance incluse (assurance sur capital restant dû,
// 1re cotisation 294,09 €), frais d'entrée 6 992 €, TAEG annoncé 4,200 %.
const realOffer = (over: Partial<LoanSettings> = {}): LoanSettings => ({
  capital: 266000,
  rate: 3.4,
  durationMonths: 300,
  monthlyPayment: 1518.88,
  offeredTaeg: 4.2,
  startDate: "",
  insuranceMode: "remaining",
  insuranceRate: 1.3267,
  insuranceAvgMonthly: 0,
  guaranteeFees: 3192,
  brokerFees: 2500,
  fileFees: 1300,
  ...over,
});

describe("annuityPayment", () => {
  it("calcule l'annuité hors assurance du prêt réel", () => {
    const p = annuityPayment(266000, 3.4, 300);
    expect(p).toBeGreaterThan(1300);
    expect(p).toBeLessThan(1330);
  });

  it("gère un taux nul", () => {
    expect(annuityPayment(120000, 0, 240)).toBeCloseTo(500, 1);
  });
});

describe("assurance sur capital restant dû", () => {
  it("reproduit la 1re cotisation de l'offre (294,09 €)", () => {
    const loan = realOffer();
    expect(insuranceForMonth(loan, loan.capital)).toBeCloseTo(294.09, 1);
  });

  it("est dégressive : première cotisation > dernière cotisation", () => {
    const schedule = buildSchedule(realOffer());
    expect(schedule[0].insurance).toBeGreaterThan(
      schedule[schedule.length - 1].insurance
    );
  });
});

describe("buildSchedule avec versement assurance incluse", () => {
  it("reproduit la 1re ligne du tableau bancaire", () => {
    const schedule = buildSchedule(realOffer());
    const m1 = schedule[0];
    expect(m1.interest).toBeCloseTo(753.67, 1);
    expect(m1.insurance).toBeCloseTo(294.09, 1);
    expect(m1.principal).toBeCloseTo(471.12, 0);
    expect(m1.balance).toBeCloseTo(265528.88, 0);
  });

  it("reproduit la 2e ligne du tableau bancaire", () => {
    const m2 = buildSchedule(realOffer())[1];
    expect(m2.interest).toBeCloseTo(752.33, 1);
    expect(m2.principal).toBeCloseTo(472.95, 0);
    expect(m2.balance).toBeCloseTo(265055.93, 0);
  });

  it("versement total constant = 1 518,88 € (hors dernière mensualité ajustée)", () => {
    const schedule = buildSchedule(realOffer());
    const payments = schedule.slice(0, 24).map((m) => m.payment + m.insurance);
    for (const p of payments) {
      expect(p).toBeCloseTo(1518.88, 1);
    }
  });

  it("solde exactement le capital (±2 mois vs tableau bancaire)", () => {
    const schedule = buildSchedule(realOffer());
    expect(schedule.length).toBeGreaterThanOrEqual(298);
    expect(schedule.length).toBeLessThanOrEqual(300);
    expect(schedule[schedule.length - 1].balance).toBeLessThan(0.01);
    const sum = schedule.reduce((a, m) => a + m.principal, 0);
    expect(sum).toBeCloseTo(266000, 0);
  });

  it("reproduit le total d'intérêts de la banque (~134 772 €)", () => {
    const schedule = buildSchedule(realOffer());
    const totalInterest = schedule.reduce((a, m) => a + m.interest, 0);
    expect(totalInterest).toBeGreaterThan(130000);
    expect(totalInterest).toBeLessThan(140000);
  });

  it("mode annuité auto si versement vide", () => {
    const schedule = buildSchedule(realOffer({ monthlyPayment: 0 }));
    expect(schedule[0].payment).toBeGreaterThan(0);
    expect(schedule[0].principal).toBeCloseTo(
      schedule[0].payment - schedule[0].interest,
      2
    );
  });
});

describe("loanFees", () => {
  it("additionne les frais d'entrée de l'offre", () => {
    expect(loanFees(realOffer())).toBe(6992);
  });
});

describe("computeTAEG", () => {
  it("recalcule le TAEG flux par flux (~4,5 % avec assurance entière)", () => {
    const taeg = computeTAEG(realOffer());
    expect(taeg).not.toBeNull();
    expect(taeg!).toBeGreaterThan(4.2);
    expect(taeg!).toBeLessThan(5);
  });

  it("le TAEG annoncé de l'offre (4,2 %) n'inclut que l'assurance obligatoire", () => {
    const taeg = computeTAEG(realOffer());
    expect(taeg!).toBeGreaterThan(realOffer().offeredTaeg);
  });

  it("sans frais ni assurance, TAEG ≈ taux débiteur", () => {
    const loan = realOffer({
      insuranceRate: 0,
      monthlyPayment: 0,
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
    expect(s.remainingMonths).toBeGreaterThanOrEqual(286);
    expect(s.remainingMonths).toBeLessThanOrEqual(288);
    expect(s.remainingBalance).toBeLessThan(266000);
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
  const noExtra = { oneTime: 0, oneTimeDate: "", monthly: 0 };

  it("solder plus vite avec une mensualité supplémentaire", () => {
    const base = projectLoan(realOffer(), 266000, 300, noExtra);
    const fast = projectLoan(realOffer(), 266000, 300, {
      oneTime: 0,
      oneTimeDate: "",
      monthly: 200,
    });
    expect(fast.monthsToPayoff).toBeLessThan(base.monthsToPayoff);
    expect(fast.payoffDate).not.toBeNull();
    expect(fast.interestSaved).toBeGreaterThan(0);
  });

  it("solder plus vite avec une somme ponctuelle immédiate", () => {
    const base = projectLoan(realOffer(), 266000, 300, noExtra);
    const fast = projectLoan(realOffer(), 266000, 300, {
      oneTime: 50000,
      oneTimeDate: "",
      monthly: 0,
    });
    expect(fast.monthsToPayoff).toBeLessThan(base.monthsToPayoff);
    expect(fast.interestSaved).toBeGreaterThan(base.interestSaved);
    const totalPrincipal = fast.rows.reduce((a, r) => a + r.principal, 0);
    expect(totalPrincipal).toBeCloseTo(266000, 0);
  });

  it("une somme ponctuelle datée dans le futur économise moins que la même immédiate", () => {
    const today = new Date();
    const inTwoYears = new Date(today.getFullYear() + 2, today.getMonth(), 1);
    const now = projectLoan(realOffer(), 266000, 300, {
      oneTime: 50000,
      oneTimeDate: "",
      monthly: 0,
    });
    const later = projectLoan(
      realOffer(),
      266000,
      300,
      { oneTime: 50000, oneTimeDate: inTwoYears.toISOString().slice(0, 7), monthly: 0 },
      today
    );
    expect(later.interestSaved).toBeLessThan(now.interestSaved);
    expect(later.monthsToPayoff).toBeLessThan(300);
  });

  it("cumule somme ponctuelle et mensualité supplémentaire", () => {
    const both = projectLoan(realOffer(), 266000, 300, {
      oneTime: 30000,
      oneTimeDate: "",
      monthly: 150,
    });
    const onlyMonthly = projectLoan(realOffer(), 266000, 300, {
      oneTime: 0,
      oneTimeDate: "",
      monthly: 150,
    });
    expect(both.monthsToPayoff).toBeLessThan(onlyMonthly.monthsToPayoff);
  });

  it("la projection annuelle commence à l'année 1 du prêt", () => {
    const { rows } = projectLoan(realOffer(), 266000, 300, noExtra);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0].year).toBe(1);
    expect(rows[1].year).toBe(2);
  });
});
