import { CronExpressionParser } from "cron-parser";
import { quartzToStandardCron } from "./quartzCron";

export function upcomingRuns(
  cron: string,
  from: number,
  count: number,
  timeZone: string,
): number[] | null {
  let iterator;
  try {
    iterator = CronExpressionParser.parse(quartzToStandardCron(cron), {
      currentDate: from,
      tz: timeZone,
    });
  } catch (error) {
    return error instanceof Error &&
      error.message === "Invalid explicit day of month definition"
      ? []
      : null;
  }
  return iterator.take(count).map((date) => date.getTime());
}

export function getScheduleTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
