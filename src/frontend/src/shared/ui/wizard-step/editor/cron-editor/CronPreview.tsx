import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@shared/i18n/hooks/useI18n";
import {
  getScheduleTimeZone,
  upcomingRuns,
} from "@shared/lib/cron/upcomingRuns";
import { CronPreviewMonth } from "./CronPreviewMonth";
import "./CronPreview.css";

function formatUntil(
  run: number,
  now: number,
  format: Intl.RelativeTimeFormat,
) {
  const seconds = Math.ceil((run - now) / 1000);
  if (seconds < 60) return format.format(seconds, "second");
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) return format.format(minutes, "minute");
  const hours = Math.ceil(minutes / 60);
  if (hours < 24) return format.format(hours, "hour");
  return format.format(Math.ceil(hours / 24), "day");
}

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
    () => upcomingRuns(cron, now, 5, timeZone),
    [cron, now, timeZone],
  );

  if (!cron.trim()) return null;
  const date = new Intl.DateTimeFormat(lang === "en" ? "en-GB" : lang, {
    timeZone,
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const time = new Intl.DateTimeFormat(lang, {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const relative = new Intl.RelativeTimeFormat(lang, { style: "short" });

  return (
    <section className="cron-preview" data-testid="schedule-cron-preview">
      <div className="cron-preview__heading">
        <strong>{t("schedule.preview.title")}</strong>
        <span>{t("schedule.preview.zone", { zone: timeZone })}</span>
      </div>
      {runs === null ? (
        <p
          className="cron-preview__message cron-preview__message--error"
          role="alert"
        >
          {t("schedule.preview.invalid")}
        </p>
      ) : runs.length === 0 ? (
        <p className="cron-preview__message" role="status">
          {t("schedule.preview.empty")}
        </p>
      ) : (
        <div className="cron-preview__panel">
          <CronPreviewMonth
            key={cron}
            cron={cron}
            runs={runs}
            timeZone={timeZone}
          />
          <ol
            className="cron-preview__runs"
            aria-label={t("schedule.preview.nextRuns")}
          >
            {runs.map((run, index) => (
              <li key={run}>
                <span className="cron-preview__number" aria-hidden="true">
                  {index + 1}
                </span>
                <span className="cron-preview__date">
                  {date.format(run)}
                  <span className="cron-preview__relative">
                    {formatUntil(run, now, relative)}
                  </span>
                </span>
                <time dateTime={new Date(run).toISOString()}>
                  {time.format(run)}
                </time>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
