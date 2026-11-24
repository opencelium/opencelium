import { CronDate, CronExpressionParser } from "cron-parser";
import { quartzToStandardCron } from "./quartzCron";
import { nextQuartzRun } from "./quartzRunTime";
import { runtimeConfig } from "@shared/config/runtimeConfig";

const MIN_QUARTZ_YEAR = 1970;
const maxQuartzYear = () => new Date().getFullYear() + 100;

function getQuartzYears(field: string): number[] {
  const minYear = MIN_QUARTZ_YEAR;
  const maxYear = maxQuartzYear();
  const years = new Set<number>();
  for (const item of field.split(",")) {
    const match = /^(\*|\d{4})(?:-(\d{4}))?(?:\/(\d+))?$/.exec(item);
    if (!match) throw new Error("Invalid Quartz year");
    const [, start, end, increment] = match;
    const first = start === "*" ? minYear : Number(start);
    const last = end ? Number(end) : start === "*" || increment ? maxYear : first;
    const step = increment ? Number(increment) : 1;
    if (first < minYear || last > maxYear || first > last || step < 1 || (start === "*" && end)) {
      throw new Error("Invalid Quartz year");
    }
    for (let year = first; year <= last; year += step) years.add(year);
  }
  return [...years].sort((a, b) => a - b);
}

function getQuartzMonthDayRule(field: string) {
  const weekday = /^(\d{1,2})W$/i.exec(field);
  const last = /^L(?:-(\d{1,2}))?(W)?$/i.exec(field);
  if (!weekday && !last) return null;
  const day = Number(weekday?.[1]);
  const offset = Number(last?.[1] ?? 0);
  if ((weekday && (day < 1 || day > 31)) || offset > 30) {
    throw new Error("Invalid Quartz day of month");
  }

  return (year: number, month: number) => {
    const monthLength = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const target = weekday ? day : monthLength - offset;
    if (target < 1 || target > monthLength) return null;
    if (!weekday && !last?.[2]) return target;
    const dayOfWeek = new Date(Date.UTC(year, month, target)).getUTCDay();
    if (dayOfWeek === 6) return target === 1 ? 3 : target - 1;
    if (dayOfWeek === 0) return target === monthLength ? target - 2 : target + 1;
    return target;
  };
}

export function createQuartzRunIterator(
  cron: string,
  from: number,
  timeZone: string,
  endDate?: number,
) {
  const parts = cron.trim().split(/\s+/);
  const yearField = parts.length === 7 ? parts.pop() : undefined;
  const monthDayRule = getQuartzMonthDayRule(parts[3] ?? "");
  if (monthDayRule) {
    if (parts[5] !== "?") throw new Error("Invalid Quartz day of week");
    parts[3] = "*";
  }
  const years = getQuartzYears(yearField ?? "*");
  const iterator = CronExpressionParser.parse(quartzToStandardCron(parts.join(" ")), {
    currentDate: from,
    endDate,
    tz: timeZone,
  });
  const yearStart = (year: number) => new CronDate(`${year}-01-01T00:00:00`, timeZone).getTime();
  let cursor = from;
  return {
    reset(date: Date) {
      cursor = date.getTime();
    },
    take(count: number) {
      const runs: CronDate[] = [];
      const cursorYear = new CronDate(cursor + 1, timeZone).getFullYear();
      for (const year of years) {
        if (year < cursorYear) continue;
        const start = yearStart(year);
        const end = yearStart(year + 1);
        if (cursor >= end - 1) continue;
        if (endDate !== undefined && start > endDate) break;
        let searchFrom = Math.max(cursor, start - 1);
        while (runs.length < count) {
          iterator.reset(new Date(searchFrom));
          const run = nextQuartzRun(iterator, searchFrom, timeZone);
          if (!run || run.getTime() >= end ||
              (endDate !== undefined && run.getTime() > endDate)) break;
          if (monthDayRule) {
            const day = monthDayRule(run.getFullYear(), run.getMonth());
            if (day !== run.getDate()) {
              const next = new CronDate(run);
              if (day !== null && day > run.getDate()) {
                next.setDate(day);
                next.setHours(0);
                next.setMinutes(0);
                next.setSeconds(0);
                next.setMilliseconds(0);
              } else {
                next.addMonth();
              }
              if (next.getTime() >= end) break;
              searchFrom = next.getTime() - 1;
              continue;
            }
          }
          runs.push(run);
          cursor = run.getTime();
          searchFrom = cursor;
        }
        if (runs.length === count) break;
      }
      return runs;
    },
  };
}

export function upcomingRuns(
  cron: string,
  from: number,
  count: number,
  timeZone: string,
): number[] | null {
  let iterator;
  try {
    iterator = createQuartzRunIterator(cron, from, timeZone);
  } catch (error) {
    return error instanceof Error &&
      error.message === "Invalid explicit day of month definition"
      ? []
      : null;
  }
  return iterator.take(count).map((date) => date.getTime());
}

// Quartz fires in the backend JVM's default zone, which the API doesn't expose — ops
// set it as `serverTimeZone` in config.json. The browser zone is only a fallback.
export function getScheduleTimeZone(): string {
  return runtimeConfig.serverTimeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
}
