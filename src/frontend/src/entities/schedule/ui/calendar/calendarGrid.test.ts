import { describe, expect, it } from "vitest";
import type { Schedule } from "../../model/types";
import type { Marker } from "../calendarSlots";
import { agendaMarkers, countRuns, dayMarkers, hasClash, hourRows, isFailedMarker, loadLevel, type Slots } from "./calendarGrid";

const schedule = (schedulerId: number, extra: Partial<Schedule> = {}): Schedule => ({
  schedulerId,
  title: `S${schedulerId}`,
  connection: { connectionId: schedulerId, title: `W${schedulerId}` },
  cronExp: "0 0 6 * * ?",
  debugMode: false,
  status: true,
  ...extra,
});
const at = (minutes: number) => Date.UTC(2026, 10, 24, 6, minutes);
const marker = (id: number, minutes: number, cadence?: number): Marker => ({
  schedule: schedule(id),
  time: at(minutes),
  cadence,
  more: false,
});

describe("calendarGrid", () => {
  it("flags only starts of different schedules at most five minutes apart", () => {
    expect(hasClash([marker(1, 0), marker(2, 30)])).toBe(false);
    expect(hasClash([marker(1, 0), marker(2, 5)])).toBe(true);
    expect(hasClash([marker(1, 0), marker(1, 2)])).toBe(false);
    expect(hasClash([marker(1, 0, 5), marker(2, 40)])).toBe(true);
    expect(hasClash([marker(1, 0, 15), marker(2, 40)])).toBe(false);
  });

  it("collapses three or more quiet hours into a band", () => {
    const active = new Set([6, 7, 8, 10]);
    expect(hourRows((hour) => active.has(hour))).toEqual([
      { kind: "band", from: 0, to: 6 },
      { kind: "hour", hour: 6 },
      { kind: "hour", hour: 7 },
      { kind: "hour", hour: 8 },
      { kind: "hour", hour: 9 },
      { kind: "hour", hour: 10 },
      { kind: "band", from: 11, to: 24 },
    ]);
    expect(hourRows(() => false)).toEqual([{ kind: "band", from: 0, to: 24 }]);
  });

  it("counts cadence markers as all runs of their hour and maps counts to levels", () => {
    expect(countRuns([marker(1, 0, 5), marker(2, 30)])).toBe(13);
    expect([0, 1, 2, 3, 4, 40].map(loadLevel)).toEqual([0, 1, 2, 2, 3, 3]);
  });

  it("lists a schedule once per month day and a cadence once per agenda day", () => {
    const slots: Slots = new Map([
      ["0:6", [marker(2, 30), marker(1, 0), marker(3, 0, 5)]],
      ["0:7", [marker(1, 60), marker(3, 60, 5)]],
    ]);
    expect(dayMarkers(slots, 0).map((m) => m.schedule.schedulerId)).toEqual([1, 3, 2]);
    expect(agendaMarkers(slots, 0).map((m) => [m.schedule.schedulerId, m.time])).toEqual([
      [1, at(0)],
      [3, at(0)],
      [2, at(30)],
      [1, at(60)],
    ]);
  });

  it("treats a marker as failed when its schedule's latest run failed", () => {
    const failed: Marker = {
      ...marker(1, 0),
      schedule: schedule(1, { lastExecution: { success: { startTime: 1, taId: "a" }, fail: { startTime: 2, taId: "b" } } }),
    };
    expect(isFailedMarker(failed)).toBe(true);
    expect(isFailedMarker(marker(2, 0))).toBe(false);
  });
});
