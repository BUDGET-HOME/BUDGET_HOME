import { describe, expect, it } from "vitest";
import { acreDirectorExemption, describeMicroAcre, microAcreWindowEnd } from "./acre";
import { arceFromAre, arceRate, calculateARE, estimateAre, maxIndemnisationDays } from "./are";

const fullYear = {
  monthlyGross: 3500,
  annualBonus: 0,
  payMonths: 12,
  age: 38,
  workedDays: 730,
  inactivityDays: 0,
  excludedDays: 0,
  partTimePercent: 100,
  overseas: false,
  individualAgreement: false,
  reducedMinimum: false,
  paidLeaveIndemnity: 0,
  severanceAboveLegal: 0,
  economicLayoff: false,
  waitingServed: false,
  rightsUsedDays: 0,
};

describe("ARE", () => {
  it("retrouve le SJR d'un salaire stable et le plafond de 548 jours", () => {
    const are = estimateAre(fullYear);
    expect(are.eligible).toBe(true);
    expect(are.sjr).toBeCloseTo((3500 * 12) / 365, 6);
    expect(are.durationDays).toBe(548);
    expect(are.durationMonths).toBe(18);
    expect(are.dailyGross).toBeCloseTo(are.sjr * 0.57, 6);
    expect(are.daily).toBeCloseTo(are.dailyGross * 0.97, 6);
    expect(are.waitingDays).toBe(7);
    expect(calculateARE(3500, 0, 38, 12).durationDays).toBe(548);
  });

  it("refuse moins de 130 jours travaillés", () => {
    const are = estimateAre({ ...fullYear, workedDays: 120 });
    expect(are.eligible).toBe(false);
    expect(are.durationDays).toBe(0);
    expect(arceFromAre(are).total).toBe(0);
  });

  it("plafonne les jours non travaillés à 70 % des jours travaillés", () => {
    const are = estimateAre({ ...fullYear, workedDays: 400, inactivityDays: 1000, excludedDays: 10 });
    expect(are.retainedDays).toBe(400 + 280 - 10);
  });

  it("allonge la durée en DROM et la réduit après une rupture conventionnelle", () => {
    expect(maxIndemnisationDays(40, false, false)).toBe(548);
    expect(maxIndemnisationDays(40, true, false)).toBe(730);
    expect(maxIndemnisationDays(40, false, true)).toBe(456);
    expect(maxIndemnisationDays(56, false, false)).toBe(685);
    expect(maxIndemnisationDays(57, false, true)).toBe(822);
    const overseas = estimateAre({ ...fullYear, overseas: true, workedDays: 800 });
    expect(overseas.durationDays).toBe(730);
  });

  it("réduit la partie fixe et le minimum au temps partiel", () => {
    const partTime = estimateAre({
      ...fullYear,
      monthlyGross: 1060,
      workedDays: 365,
      partTimePercent: 50,
    });
    const full = estimateAre({ ...fullYear, monthlyGross: 1060, workedDays: 365, partTimePercent: 100 });
    expect(partTime.dailyGross).toBeLessThan(full.dailyGross);
    expect(partTime.dailyGross).toBeCloseTo(partTime.sjr * 0.404 + 13.18 * 0.5, 6);
  });

  it("applique la dégressivité de 30 % à partir du 183e jour, avec un plancher", () => {
    const are = estimateAre({ ...fullYear, monthlyGross: 6000, age: 40 });
    expect(are.degressive).toBe(true);
    expect(are.dailyGross).toBeCloseTo(are.sjr * 0.57, 6);
    const reduced = Math.max(are.dailyGross * 0.7, 92.57);
    const fullDays = 182;
    const reducedDays = are.durationDays - fullDays;
    const net = (gross: number) => gross - gross * 0.03 - gross * 0.067 * 0.9825;
    expect(are.remainingNet).toBeCloseTo(fullDays * net(are.dailyGross) + reducedDays * net(reduced), 4);
  });

  it("calcule le différé de rupture et de congés payés", () => {
    const are = estimateAre({
      ...fullYear,
      severanceAboveLegal: 11180,
      paidLeaveIndemnity: areSjrTimes(fullYear, 40),
      economicLayoff: true,
      waitingServed: true,
    });
    expect(are.deferSeveranceDays).toBe(75);
    expect(are.deferLeaveDays).toBe(30);
    expect(are.waitingDays).toBe(0);
  });
});

function areSjrTimes(input: typeof fullYear, days: number): number {
  return estimateAre(input).sjr * days;
}

describe("ARCE", () => {
  it("verse 60 % des droits restants en deux fois, ou 45 % avant juillet 2023", () => {
    expect(arceRate("")).toBe(0.6);
    expect(arceRate("2023-07-01")).toBe(0.6);
    expect(arceRate("2023-06-30")).toBe(0.45);
    const are = estimateAre({ ...fullYear, rightsUsedDays: 48 });
    const plan = arceFromAre(are, { contractEndDate: "2024-01-15" });
    expect(plan.rate).toBe(0.6);
    expect(plan.capital).toBe(Math.round(are.remainingNet * 0.6));
    expect(plan.first + plan.second).toBe(plan.total);
    expect(plan.firstMonthIndex).toBe(0);
    expect(plan.secondMonthIndex).toBe(6);
    const legacy = arceFromAre(are, { contractEndDate: "2022-12-01" });
    expect(legacy.capital).toBe(Math.round(are.remainingNet * 0.45));
  });

  it("retire le second versement et bloque le micro sans ACRE", () => {
    const are = estimateAre(fullYear);
    const once = arceFromAre(are, { secondPayment: false });
    expect(once.second).toBe(0);
    expect(once.total).toBe(once.first);
    expect(once.capital).toBeGreaterThan(once.total);
    const blocked = arceFromAre(are, { microWithoutAcre: true });
    expect(blocked.total).toBe(0);
    expect(blocked.blockedReason).toMatch(/ACRE/);
  });
});

describe("ACRE", () => {
  const on = new Date(2026, 9, 21);

  it("termine la fenêtre micro à la fin du troisième trimestre civil suivant", () => {
    expect(microAcreWindowEnd(new Date(2026, 2, 15))).toEqual(new Date(2026, 11, 31));
    expect(microAcreWindowEnd(new Date(2026, 6, 1))).toEqual(new Date(2027, 5, 30));
  });

  it("passe de 10,6 % à 15,9 % le 1er juillet 2026, puis revient à 21,2 %", () => {
    expect(describeMicroAcre(true, "2026-03-01", on).rate).toBe(10.6);
    expect(describeMicroAcre(true, "2026-07-01", on).rate).toBe(15.9);
    expect(describeMicroAcre(true, "2025-01-10", on).rate).toBe(21.2);
    expect(describeMicroAcre(false, "2026-08-01", on).rate).toBe(21.2);
    expect(describeMicroAcre(true, "", on).rate).toBe(15.9);
  });

  it("dégresse l'exonération dirigeant entre 75 % du PASS et le PASS", () => {
    expect(acreDirectorExemption(true, 30000, "2026-08-01", on)).toBe(0.25);
    expect(acreDirectorExemption(true, 48060, "2026-08-01", on)).toBe(0);
    expect(acreDirectorExemption(true, (36045 + 48060) / 2, "2026-08-01", on)).toBeCloseTo(0.125, 6);
    expect(acreDirectorExemption(true, 20000, "2024-01-01", on)).toBe(0);
    expect(acreDirectorExemption(false, 20000, "2026-08-01", on)).toBe(0);
  });
});
