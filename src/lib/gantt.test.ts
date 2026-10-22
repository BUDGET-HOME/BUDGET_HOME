import { describe, expect, it } from "vitest";
import { barPercent, datePercent, planningWindow, taskDates } from "./gantt";

const launch = new Date(2026, 9, 15);

describe("planning au jour", () => {
  it("place une tâche datée avant le lancement", () => {
    const dates = taskDates(
      { startDate: "2026-09-02", endDate: "2026-09-20", startMonth: 1, durationMonths: 1 },
      launch,
    );
    expect(dates.start.getMonth()).toBe(8);
    expect(dates.start.getDate()).toBe(2);
    expect(dates.end.getDate()).toBe(20);

    const window = planningWindow(
      [{ id: "a", name: "Préparation", startDate: "2026-09-02", endDate: "2026-09-20", category: "admin", done: false }],
      launch,
    );
    expect(window.start.getTime()).toBeLessThan(dates.start.getTime());
    const launchPct = datePercent(launch, window);
    const bar = barPercent(dates.start, dates.end, window);
    expect(bar.left).toBeGreaterThanOrEqual(0);
    expect(bar.left + bar.width).toBeLessThan(launchPct);
  });

  it("conserve le calendrier mensuel des tâches déjà enregistrées sans date", () => {
    const dates = taskDates({ startDate: "", endDate: "", startMonth: 2, durationMonths: 1 }, launch);
    expect(dates.start).toEqual(new Date(2026, 10, 1));
    expect(dates.end).toEqual(new Date(2026, 10, 30));
  });
});
