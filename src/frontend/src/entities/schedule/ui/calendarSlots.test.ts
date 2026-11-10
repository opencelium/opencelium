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
it("limits markers to the requested year and excludes invalid day combinations", () => {
  vi.useFakeTimers().setSystemTime(new Date("2026-12-30T00:00:00Z"));
  const days = weekDays(0, "Asia/Tashkent");
  const slots = calendarSlots(
    [schedule(1, "0 0 8 * * ? 2027"), schedule(2, "0 0 8 * * MON")],
    days,
    "Asia/Tashkent",
  );
  expect([...slots.keys()]).toEqual(["4:8", "5:8", "6:8"]);
});
it("shows only the resolved date for Quartz weekday and last-day rules", () => {
  vi.useFakeTimers().setSystemTime(new Date("2026-02-25T00:00:00Z"));
  const days = weekDays(0, "Europe/Berlin");
  const slots = calendarSlots(
    [schedule(1, "0 0 8 28W * ?"), schedule(2, "0 0 8 L-3 * ?")],
    days,
    "Europe/Berlin",
  );
  expect(slots.get("2:8")?.map(({ schedule }) => schedule.schedulerId)).toEqual([2]);
  expect(slots.get("4:8")?.map(({ schedule }) => schedule.schedulerId)).toEqual([1]);
  expect(slots.size).toBe(2);
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
it.each(["0", "16"])("limits every-minute schedules at second %s to one marker per hour", (second) => {
  const days = weekDays(0, "UTC");
  const slots = calendarSlots([schedule(1, `${second} * * * * ?`)], days, "UTC");
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
