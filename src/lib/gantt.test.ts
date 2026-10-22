import { describe, expect, it } from "vitest";
import { barPercent, datePercent, dependencyArrows, dependencyCreatesCycle, planningWindow, scheduleDependencies, taskDates } from "./gantt";

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
      [{ id: "a", name: "Préparation", startDate: "2026-09-02", endDate: "2026-09-20", category: "admin", done: false, kind: "task", dependsOn: "" }],
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

  it("décale une tâche au lendemain de celle dont elle dépend et trace la flèche", () => {
    const tasks = scheduleDependencies([
      { id: "a", name: "A", startDate: "2026-10-01", endDate: "2026-10-10", category: "admin", done: false, kind: "task", dependsOn: "" },
      { id: "b", name: "B", startDate: "2026-10-04", endDate: "2026-10-08", category: "finance", done: false, kind: "task", dependsOn: "a" },
    ], launch);
    expect(tasks[1].startDate).toBe("2026-10-11");
    expect(tasks[1].endDate).toBe("2026-10-15");
    expect(dependencyCreatesCycle(tasks, "a", "b")).toBe(true);
    const window = planningWindow(tasks, launch);
    const arrows = dependencyArrows(tasks, launch, window);
    expect(arrows).toHaveLength(1);
    expect(arrows[0].fromRow).toBe(0);
    expect(arrows[0].toRow).toBe(1);
    expect(arrows[0].toX).toBeCloseTo(arrows[0].fromX, 5);
  });
});
