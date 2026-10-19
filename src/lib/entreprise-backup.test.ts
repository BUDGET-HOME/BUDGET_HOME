import { describe, expect, it } from "vitest";
import {
  CASH_FLOW_AUTOSYNC_KEY,
  CASH_FLOW_STORAGE_KEY,
  isEntrepriseBackup,
  parseCashFlow,
  parseEntrepriseBackup,
  pickFields,
  writeStoredCashFlow,
} from "./entreprise-backup";

describe("sauvegarde entreprise", () => {
  it("reconnaît un fichier entreprise et refuse un budget foyer", () => {
    expect(isEntrepriseBackup({ kind: "budget-home-entreprise", version: 1 })).toBe(true);
    expect(isEntrepriseBackup({ name1: "A", expenses: [] })).toBe(false);
    expect(isEntrepriseBackup(null)).toBe(false);
  });

  it("retire les champs hors schéma", () => {
    expect(
      pickFields({ tjm: 500, user_id: "secret", id: "row" }, ["tjm"])
    ).toEqual({ tjm: 500 });
  });

  it("rejette une trésorerie incomplète", () => {
    expect(parseCashFlow({ items: [{ label: "CA" }], initialBalance: 0 })).toBeNull();
  });

  it("normalise une sauvegarde entreprise", () => {
    const parsed = parseEntrepriseBackup({
      kind: "budget-home-entreprise",
      version: 1,
      cashFlow: {
        initialBalance: 1000,
        items: [
          {
            label: "Facture",
            amount: 2000,
            type: "credit",
            frequency: "mensuel",
            startDate: "2026-01-01",
          },
        ],
      },
      freelance: { tjm: 480, user_id: "secret", extra: true },
      gantt: { tasks: [{ id: "a", name: "Statuts" }], user_id: "secret" },
    });
    expect("backup" in parsed).toBe(true);
    if (!("backup" in parsed)) return;
    expect(parsed.backup.freelance).toEqual({ tjm: 480 });
    expect(parsed.backup.gantt).toEqual({ tasks: [{ id: "a", name: "Statuts" }] });
    expect(parsed.backup.cashFlow?.items[0].label).toBe("Facture");
    expect(parsed.backup.cashFlow?.items[0].id).toBe("cf-1");
  });

  it("écrit la trésorerie sous la clé lue par l'écran", () => {
    writeStoredCashFlow({
      initialBalance: 50,
      items: [
        {
          id: "1",
          label: "Loyer bureau",
          amount: 400,
          type: "debit",
          frequency: "mensuel",
          startDate: "2026-02-01",
          endDate: null,
          category: "Charges",
          notes: "",
        },
      ],
    });
    expect(JSON.parse(localStorage.getItem(CASH_FLOW_STORAGE_KEY) ?? "{}").initialBalance).toBe(50);
    expect(localStorage.getItem(CASH_FLOW_AUTOSYNC_KEY)).toBe("0");
  });
});
