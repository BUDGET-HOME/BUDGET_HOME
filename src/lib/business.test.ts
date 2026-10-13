import { describe, expect, it } from "vitest";
import { bestStatus, simulateYear, socialContributions } from "./business";

describe("socialContributions", () => {
  it("micro: cotisations sur 50% du CA", () => {
    expect(socialContributions("micro", 50000, 5000)).toBeCloseTo(50000 * 0.5 * 0.45);
  });

  it("EI au réel: cotisations sur le bénéfice", () => {
    expect(socialContributions("ei", 50000, 20000)).toBeCloseTo(30000 * 0.45);
  });
});

describe("simulateYear", () => {
  it("retourne les 4 statuts", () => {
    const results = simulateYear({
      status: "micro",
      services: [],
      annualRevenue: 60000,
      monthlyBusinessExpense: 500,
    });
    expect(results.length).toBe(4);
    expect(new Set(results.map((r) => r.status))).toEqual(
      new Set(["micro", "ei", "eurl", "sasu"])
    );
  });

  it("à bas revenu (30k€), la micro-entreprise est la plus avantageuse", () => {
    const results = simulateYear({
      status: "micro",
      services: [],
      annualRevenue: 30000,
      monthlyBusinessExpense: 200,
    });
    const { best } = bestStatus(results);
    expect(best.status).toBe("micro");
  });

  it("à haut revenu (150k€), la micro n'est plus la plus avantageuse", () => {
    const results = simulateYear({
      status: "micro",
      services: [],
      annualRevenue: 150000,
      monthlyBusinessExpense: 1000,
    });
    const micro = results.find((r) => r.status === "micro")!;
    expect(micro.eligible).toBe(false);
    const best = bestStatus(results).best;
    expect(best.status).not.toBe("micro");
  });

  it("le revenu net augmente avec le CA pour chaque statut", () => {
    const low = simulateYear({
      status: "micro",
      services: [],
      annualRevenue: 40000,
      monthlyBusinessExpense: 500,
    });
    const high = simulateYear({
      status: "micro",
      services: [],
      annualRevenue: 80000,
      monthlyBusinessExpense: 500,
    });
    for (const status of ["micro", "ei", "eurl", "sasu"] as const) {
      const l = low.find((r) => r.status === status)!;
      const h = high.find((r) => r.status === status)!;
      expect(h.totalTakeHome).toBeGreaterThan(l.totalTakeHome);
    }
  });
});
