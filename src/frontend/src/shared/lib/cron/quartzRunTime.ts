import { CronDate, type CronExpression } from "cron-parser";

function wallTime(date: CronDate) {
  return Date.UTC(
    date.getFullYear(), date.getMonth(), date.getDate(),
    date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds(),
  );
}

export function nextQuartzRun(iterator: CronExpression, cursor: number, timeZone: string) {
  const nextSecond = Math.floor(cursor / 1000) * 1000 + 1000;
  const first = new CronDate(nextSecond, timeZone);
  const previous = new CronDate(nextSecond - 1000, timeZone);

  const rolledBack = wallTime(first) < wallTime(previous);
  if (rolledBack) iterator.reset(first);
  let run = rolledBack && iterator.includesDate(first) ? first : iterator.take(1)[0];
  while (run) {
    const time = run.getTime();
    const hour = run.getHours();
    if (!iterator.fields.hour.values.some((value) => value === hour)) {
      run = iterator.take(1)[0];
      continue;
    }

    const tomorrow = new CronDate(time + 86_400_000, timeZone);
    const offsetChange = (wallTime(run) - time) - (wallTime(tomorrow) - tomorrow.getTime());
    if (offsetChange > 0) {
      const later = new CronDate(time + offsetChange, timeZone);
      if (wallTime(later) === wallTime(run)) return later;
    }
    return run;
  }
  return undefined;
}
