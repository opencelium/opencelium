import { CronDate } from "cron-parser";
import { createQuartzRunIterator } from "@shared/lib/cron/upcomingRuns";
import type { Schedule } from "../model/types";

export type CalendarView = "day" | "three" | "work" | "week" | "month";

export function calendarDays(anchor: number, view: CalendarView, zone: string) {
  const day = new CronDate(anchor, zone);
  day.setHours(0);
  day.setMinutes(0);
  day.setSeconds(0);
  day.setMilliseconds(0);
  if (view === "week" || view === "work") day.setDate(day.getDate() - ((day.getDay() + 6) % 7));
  if (view === "month") day.setDate(1);
  const monthStart = day.getTime();
  const month = day.getMonth();
  if (view === "month") day.setDate(1 - ((day.getDay() + 6) % 7));
  const length = { day: 1, three: 3, work: 5, week: 7, month: 31 }[view];
  const days = [day.getTime()];
  do {
    day.addDay();
    days.push(day.getTime());
  } while (view === "month" ? (day.getMonth() === month || day.getTime() < monthStart || day.getDay() !== 1) : days.length <= length);
  return days;
}

export function moveCalendarDate(anchor: number, view: CalendarView, step: number, zone: string) {
  const day = new CronDate(anchor, zone);
  if (view === "month") {
    day.setDate(1);
    day.setMonth(day.getMonth() + step);
  } else {
    day.setDate(day.getDate() + step * (view === "week" || view === "work" ? 7 : view === "three" ? 3 : 1));
  }
  return day.getTime();
}

type Marker = {
  schedule: Schedule;
  time: number;
  cadence?: number;
  more: boolean;
};

export function calendarSlots(
  schedules: Schedule[],
  days: number[],
  zone: string,
  from = days[0],
) {
  const slots = new Map<string, Marker[]>();
  for (const schedule of schedules) {
    if (!schedule.cronExp?.trim()) continue;
    try {
      const iterator = createQuartzRunIterator(schedule.cronExp, from - 1, zone, days[days.length - 1] - 1);
      const [second, minute] = schedule.cronExp.trim().split(/\s+/);
      const step = /^(?:0|\*)\/(\d+)$/.exec(minute);
      const cadence =
        /^\d+$/.test(second)
          ? minute === "*"
            ? 1
            : step
              ? Number(step[1])
              : undefined
          : undefined;
      for (let slot = 0; slot < (days.length - 1) * 25; slot++) {
        const run = iterator.take(1)[0];
        if (!run) break;
        const time = run.getTime();
        const day = days.findIndex(
          (start, index) => time >= start && time < days[index + 1],
        );
        if (day < 0) break;
        const key = day + ":" + run.getHours();
        const hourEnd = new CronDate(time, zone);
        hourEnd.setMinutes(0);
        hourEnd.setSeconds(0);
        hourEnd.setMilliseconds(0);
        hourEnd.addHour();
        const end = Math.min(hourEnd.getTime(), days[day + 1]);
        const next = iterator.take(1)[0];
        const more = Boolean(next && next.getTime() < end);
        const markers = slots.get(key) ?? [];
        if (more && cadence) {
          markers.push({ schedule, time, cadence, more });
        } else {
          iterator.reset(new Date(time - 1));
          const runs = iterator.take(5).filter((date) => date.getTime() < end);
          markers.push(
            ...runs
              .map((date, index) => ({
                schedule,
                time: date.getTime(),
                more: index === 3 && runs.length === 5,
              }))
              .slice(0, 4),
          );
        }
        slots.set(key, markers);
        iterator.reset(new Date(end - 1));
      }
    } catch {
      continue;
    }
  }
  return slots;
}
