import { describe, expect, it } from "vitest";
import type { Schedule } from "../../model/types";
import { nextRuns, rollingHourCounts } from "./rollingLoad";

const schedule = (schedulerId: number, cronExp: string, status = true): Schedule => ({
  schedulerId,
  title: `S${schedulerId}`,
  connection: { connectionId: schedulerId, title: `W${schedulerId}` },
  cronExp,
  debugMode: false,
  status,
});
const start = Date.UTC(2026, 10, 24, 13);

describe("rollingLoad", () => {
  it("counts runs per hour from the start hour, including paused schedules, and skips cron-less ones", () => {
    const counts = rollingHourCounts(
      [
        schedule(1, "0 0 6 * * ?"),
        schedule(2, "0 30 6 * * ?"),
        schedule(3, "0 */15 * * * ?"),
        schedule(4, "0 0 7 * * ?", false),
        schedule(5, ""),
      ],
      start,
      24,
      "UTC",
    );
    expect(counts).toHaveLength(24);
    expect(counts[0]).toBe(4);
    expect(counts[17]).toBe(6);
    expect(counts[18]).toBe(5);
    expect(counts.reduce((sum, value) => sum + value, 0)).toBe(99);
  });

  it("lists the soonest next runs of every schedule with a cron expression, paused ones included", () => {
    const runs = nextRuns(
      [schedule(1, "0 0 6 * * ?"), schedule(2, "0 0 14 * * ?"), schedule(3, "0 0 13 * * ?", false), schedule(4, "invalid")],
      start,
      4,
      "UTC",
    );
    expect(runs.map((run) => [run.schedule.schedulerId, run.time])).toEqual([
      [2, Date.UTC(2026, 10, 24, 14)],
      [1, Date.UTC(2026, 10, 25, 6)],
      [3, Date.UTC(2026, 10, 25, 13)],
    ]);
  });
});
