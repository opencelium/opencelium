import { CronDate } from "cron-parser";
import { createQuartzRunIterator, upcomingRuns } from "@shared/lib/cron/upcomingRuns";
import type { Schedule } from "../../model/types";

const HOUR_MS = 3_600_000;

export type UpcomingRun = { schedule: Schedule; time: number };

// The calendar treats every schedule with a cron expression as active, whatever its status.
const hasCron = (schedule: Schedule) => Boolean(schedule.cronExp?.trim());

export function startOfHour(time: number, zone: string) {
  const date = new CronDate(time, zone);
  date.setMinutes(0);
  date.setSeconds(0);
  date.setMilliseconds(0);
  return date.getTime();
}

/** Runs per hour of schedules with a cron expression, for `hours` hours from `start`. */
export function rollingHourCounts(schedules: Schedule[], start: number, hours: number, zone: string): number[] {
  const counts = Array<number>(hours).fill(0);
  const end = start + hours * HOUR_MS;
  for (const schedule of schedules.filter(hasCron)) {
    try {
      const iterator = createQuartzRunIterator(schedule.cronExp, start - 1, zone, end - 1);
      for (let guard = 0; guard < hours * 60; guard++) {
        const run = iterator.take(1)[0];
        if (!run || run.getTime() >= end) break;
        counts[Math.floor((run.getTime() - start) / HOUR_MS)]++;
      }
    } catch {
      continue;
    }
  }
  return counts;
}

/** The next run of each schedule with a cron expression, soonest first. */
export function nextRuns(schedules: Schedule[], now: number, count: number, zone: string): UpcomingRun[] {
  return schedules
    .filter(hasCron)
    .flatMap((schedule) => {
      const time = upcomingRuns(schedule.cronExp, now, 1, zone)?.[0];
      return time === undefined ? [] : [{ schedule, time }];
    })
    .sort((a, b) => a.time - b.time || a.schedule.schedulerId - b.schedule.schedulerId)
    .slice(0, count);
}
