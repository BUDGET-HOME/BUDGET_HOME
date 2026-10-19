import { describe, expect, it } from "vitest";
import { isMissingTableError, keepPlan, newestRow } from "./json-document";

describe("document JSON par compte", () => {
  it("choisit la ligne la plus récente, puis l'id le plus grand", () => {
    const rows = [
      { id: "a", updated_at: "2026-01-01T00:00:00.000Z" },
      { id: "c", updated_at: "2026-03-01T00:00:00.000Z" },
      { id: "b", updated_at: "2026-03-01T00:00:00.000Z" },
    ];
    expect(newestRow(rows)?.id).toBe("c");
    expect(keepPlan(rows)).toEqual({ keepId: "c", deleteIds: ["a", "b"] });
  });

  it("insère quand aucune ligne n'existe", () => {
    expect(keepPlan([])).toBeNull();
  });

  it("reconnaît une table absente", () => {
    expect(isMissingTableError({ code: "PGRST205", message: "schema cache" })).toBe(true);
    expect(isMissingTableError({ message: "relation does not exist" })).toBe(true);
    expect(isMissingTableError({ code: "42501", message: "permission denied" })).toBe(false);
  });
});
