import { expect, it, vi, afterEach } from "vitest";
import { calendarSlots, weekDays } from "./calendarSlots";
import type { Schedule } from "../model/types";

const schedule = (schedulerId: number, cronExp: string): Schedule => ({
  schedulerId,
  cronExp,
  title: "Test",
  status: true,
  debugMode: false,
  connection: { connectionId: 1, title: "Test" },
});
afterEach(() => vi.useRealTimers());
it("keeps all seven daily markers, including the last day", () => {
  vi.useFakeTimers().setSystemTime(new Date("2026-11-04T00:00:00Z"));
  const days = weekDays(0, "Asia/Tashkent");
  const slots = calendarSlots(
    [schedule(1, "0 0 8 * * ?")],
    days,
    "Asia/Tashkent",
  );
  expect([...slots.keys()]).toEqual(
    Array.from({ length: 7 }, (_, day) => `${day}:8`),
  );
});
it("aligns Quartz weekdays and retains overlaps", () => {
  vi.useFakeTimers().setSystemTime(new Date("2026-11-04T00:00:00Z"));
  const days = weekDays(0, "Asia/Tashkent");
  const slots = calendarSlots(
    [schedule(1, "0 0 8 ? * 2-6"), schedule(2, "0 30 8 ? * MON-FRI")],
    days,
    "Asia/Tashkent",
  );
  expect(slots.size).toBe(5);
  expect(slots.get("0:8")).toHaveLength(2);
  expect(slots.has("5:8")).toBe(false);
});
it("limits every-minute schedules to one marker per hour", () => {
  const days = weekDays(0, "UTC");
  const slots = calendarSlots([schedule(1, "0 * * * * ?")], days, "UTC");
  expect([...slots.values()].flat()).toHaveLength(168);
  expect(slots.get("0:0")?.[0].cadence).toBe(1);
});
it("keeps hours across daylight-saving transitions", () => {
  vi.useFakeTimers().setSystemTime(new Date("2026-10-23T00:00:00Z"));
  const days = weekDays(0, "Europe/Berlin");
  expect(days[7] - days[0]).toBe(169 * 3600000);
  expect(
    calendarSlots([schedule(1, "0 0 8 * * ?")], days, "Europe/Berlin").size,
  ).toBe(7);
});
