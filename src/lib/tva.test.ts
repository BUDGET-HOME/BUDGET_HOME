import { describe, expect, it } from "vitest";
import { estimateVat } from "./tva";

describe("TVA", () => {
  it("ne facture rien sous le plafond de franchise", () => {
    const vat = estimateVat(2000, 0);
    expect(vat.monthly).toBe(0);
    expect(vat.notice).toMatch(/Franchise en base/);
  });

  it("signale le seuil de base puis le seuil majoré", () => {
    expect(estimateVat(37500 / 12 + 1, 0).notice).toMatch(/37 500/);
    expect(estimateVat(41250 / 12 + 1, 0).notice).toMatch(/41 250/);
  });

  it("calcule 20 % du CA hors taxe sans l'ajouter au net", () => {
    const vat = estimateVat(10000, 20);
    expect(vat.monthly).toBe(2000);
    expect(vat.annual).toBe(24000);
    expect(vat.monthlyTtc).toBe(12000);
    expect(vat.notice).toMatch(/reste à vivre/);
  });
});
