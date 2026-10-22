import { describe, expect, it } from "vitest";
import { projectCashFlow } from "./cash-flow";
import { activityMonthStart, activityStartIso, addCalendarMonths } from "./activity-calendar";

describe("début d'activité", () => {
  it("cale le mois 1 sur le mois saisi", () => {
    const origin = activityMonthStart("2026-10-15");
    expect(origin.getFullYear()).toBe(2026);
    expect(origin.getMonth()).toBe(9);
    expect(origin.getDate()).toBe(1);
    expect(addCalendarMonths(origin, 6).getMonth()).toBe(3);
    expect(activityStartIso("2026-10-15")).toBe("2026-10-15");

    const rows = projectCashFlow([], 0, origin, 3);
    expect(rows[0].label).toMatch(/oct/i);
    expect(rows[0].label).toMatch(/2026/);
    expect(rows[2].label).toMatch(/déc/i);
  });

  it("utilise le mois de repli quand la date est vide", () => {
    const fallback = new Date(2026, 3, 22);
    const origin = activityMonthStart("", fallback);
    expect(origin.getMonth()).toBe(3);
    expect(origin.getDate()).toBe(1);
    expect(activityStartIso("pas une date", fallback)).toBe("2026-04-22");
  });
});
