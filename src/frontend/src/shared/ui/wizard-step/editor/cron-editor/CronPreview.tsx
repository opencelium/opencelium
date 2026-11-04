import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@shared/i18n/hooks/useI18n";
import { getScheduleTimeZone, upcomingRuns } from "@shared/lib/cron/upcomingRuns";

export function CronPreview({ cron }: { cron: string }) {
  const { t, lang } = useI18n("entities");
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (!cron.trim()) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [cron]);
  const timeZone = getScheduleTimeZone();
  const runs = useMemo(
    () =>
      upcomingRuns(cron, now, 5, timeZone),
    [cron, now, timeZone],
  );
  if (!cron.trim()) return null;
  const format = new Intl.DateTimeFormat(lang, {
    timeZone,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  return (
    <section data-testid="schedule-cron-preview" aria-live="polite">
      <strong>{t("schedule.preview.title")}</strong>
      <div>{t("schedule.preview.zone", { zone: timeZone })}</div>
      {runs === null ? (
        <p role="alert">{t("schedule.preview.invalid")}</p>
      ) : runs.length === 0 ? (
        <p>{t("schedule.preview.empty")}</p>
      ) : (
        <ol>
          {runs.map((run) => (
            <li key={run}>
              <time dateTime={new Date(run).toISOString()}>
                {format.format(run)}
              </time>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
