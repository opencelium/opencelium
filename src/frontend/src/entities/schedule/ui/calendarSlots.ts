import { CronDate, CronExpressionParser } from "cron-parser";
import { quartzToStandardCron } from "@shared/lib/cron/quartzCron";
import type { Schedule } from "../model/types";

export function weekDays(offset: number, zone: string) {
  const day = new CronDate(new Date(), zone);
  day.setHours(0);
  day.setMinutes(0);
  day.setSeconds(0);
  day.setMilliseconds(0);
  day.setDate(day.getDate() - ((day.getDay() + 6) % 7) + offset * 7);
  return Array.from({ length: 8 }, () => {
    const start = day.getTime();
    day.addDay();
    return start;
  });
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
) {
  const slots = new Map<string, Marker[]>();
  for (const schedule of schedules) {
    if (!schedule.cronExp?.trim()) continue;
    try {
      const iterator = CronExpressionParser.parse(
        quartzToStandardCron(schedule.cronExp),
        {
          currentDate: days[0] - 1,
          endDate: days[7] - 1,
          tz: zone,
        },
      );
      const [second, minute] = schedule.cronExp.trim().split(/\s+/);
      const step = /^(?:0|\*)\/(\d+)$/.exec(minute);
      const cadence =
        second === "0"
          ? minute === "*"
            ? 1
            : step
              ? Number(step[1])
              : undefined
          : undefined;
      for (let slot = 0; slot < 200; slot++) {
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
