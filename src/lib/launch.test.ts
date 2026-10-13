import { describe, expect, it } from "vitest";
import { acreRate, simulateLaunch } from "./launch";

describe("acreRate", () => {
  it("donne les taux d'exonération ACRE par statut", () => {
    expect(acreRate("micro")).toBe(0.12);
    expect(acreRate("eurl")).toBe(0.05);
    expect(acreRate("sasu")).toBe(0.07);
  });
});

describe("simulateLaunch", () => {
  const base = {
    status: "micro" as const,
    regionMonthlyGrant: 1000,
    regionGrantMonths: 6,
    acre: true,
    personalContribution: 12000,
    monthlyProvision: 0,
  };

  it("calcule les aides régionales totales", () => {
    const r = simulateLaunch(base, 1500, 2500);
    expect(r.totalGrants).toBe(6000);
  });

  it("calcule l'exonération ACRE si activée", () => {
    const r = simulateLaunch(base, 1500, 2500);
    expect(r.totalAcreExemption).toBeGreaterThan(0);
    const noAcre = simulateLaunch({ ...base, acre: false }, 1500, 2500);
    expect(noAcre.totalAcreExemption).toBe(0);
  });

  it("estime la trésorerie tenable (runway)", () => {
    const r = simulateLaunch({ ...base, regionMonthlyGrant: 0, regionGrantMonths: 0, personalContribution: 12000 }, 1000, 1000);
    expect(r.runwayMonths).toBe(12);
  });

  it("le runway tient compte des aides régionales", () => {
    const without = simulateLaunch({ ...base, regionMonthlyGrant: 0, regionGrantMonths: 0, personalContribution: 6000 }, 1000, 1000);
    const withGrant = simulateLaunch({ ...base, regionMonthlyGrant: 1000, regionGrantMonths: 6, personalContribution: 6000 }, 1000, 1000);
    expect(withGrant.runwayMonths).toBeGreaterThan(without.runwayMonths);
  });
});
