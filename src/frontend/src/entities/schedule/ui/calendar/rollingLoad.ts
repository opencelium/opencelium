import { CronDate } from "cron-parser";
import { createQuartzRunIterator, upcomingRuns } from "@shared/lib/cron/upcomingRuns";
import type { Schedule } from "../../model/types";

const HOUR_MS = 3_600_000;

export type UpcomingRun = { schedule: Schedule; time: number };

const isActive = (schedule: Schedule) => Boolean(schedule.status) && Boolean(schedule.cronExp?.trim());

export function startOfHour(time: number, zone: string) {
  const date = new CronDate(time, zone);
  date.setMinutes(0);
  date.setSeconds(0);
  date.setMilliseconds(0);
  return date.getTime();
}

/** Runs per hour of active schedules, for `hours` hours from `start`. */
export function rollingHourCounts(schedules: Schedule[], start: number, hours: number, zone: string): number[] {
  const counts = Array<number>(hours).fill(0);
  const end = start + hours * HOUR_MS;
  for (const schedule of schedules.filter(isActive)) {
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

/** The next run of each active schedule, soonest first. */
export function nextRuns(schedules: Schedule[], now: number, count: number, zone: string): UpcomingRun[] {
  return schedules
    .filter(isActive)
    .flatMap((schedule) => {
      const time = upcomingRuns(schedule.cronExp, now, 1, zone)?.[0];
      return time === undefined ? [] : [{ schedule, time }];
    })
    .sort((a, b) => a.time - b.time || a.schedule.schedulerId - b.schedule.schedulerId)
    .slice(0, count);
}
