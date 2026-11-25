import { useMemo, useState } from "react";
import { CronDate } from "cron-parser";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { useI18n } from "@shared/i18n/hooks/useI18n";
import { upcomingRuns } from "@shared/lib/cron/upcomingRuns";

type Props = {
  cron: string;
  runs: number[];
  timeZone: string;
};

function getMonth(
  cron: string,
  firstRun: number,
  offset: number,
  timeZone: string,
) {
  const day = new CronDate(firstRun, timeZone);
  day.setDate(1);
  day.setMonth(day.getMonth() + offset);
  day.setHours(0);
  day.setMinutes(0);
  day.setSeconds(0);
  day.setMilliseconds(0);

  const start = day.getTime();
  const month = day.getMonth();
  const leadingDays = (day.getDay() + 6) % 7;
  const days = [];
  while (day.getMonth() === month) {
    const dayStart = day.getTime();
    const number = day.getDate();
    day.addDay();
    const end = day.getTime();
    const next =
      end > firstRun
        ? upcomingRuns(cron, Math.max(dayStart, firstRun) - 1, 1, timeZone)?.[0]
        : undefined;
    days.push({
      start: dayStart,
      end,
      number,
      hasRun: next !== undefined && next < end,
    });
  }
  return { start, leadingDays, days };
}

export function CronPreviewMonth({ cron, runs, timeZone }: Props) {
  const { t, lang } = useI18n("entities");
  const [offset, setOffset] = useState(0);
  const firstRun = runs[0];
  const { start, leadingDays, days } = useMemo(
    () => getMonth(cron, firstRun, offset, timeZone),
    [cron, firstRun, offset, timeZone],
  );
  const monthLabel = new Intl.DateTimeFormat(lang, {
    timeZone,
    month: "long",
    year: "numeric",
  }).format(start);
  const weekday = new Intl.DateTimeFormat(lang, {
    timeZone: "UTC",
    weekday: "short",
  });
  const dateLabel = new Intl.DateTimeFormat(lang, {
    timeZone,
    dateStyle: "full",
  });
  const weekdays = Array.from({ length: 7 }, (_, index) =>
    weekday.format(Date.UTC(2024, 0, index + 1)).slice(0, 2),
  );
  const weekCount = Math.ceil((leadingDays + days.length) / 7);

  return (
    <div className="cron-preview__month">
      <div className="cron-preview__month-header">
        <Button
          icon={<LeftOutlined />}
          aria-label={t("schedule.preview.previousMonth")}
          onClick={() => setOffset((value) => value - 1)}
        />
        <strong aria-live="polite">{monthLabel}</strong>
        <Button
          icon={<RightOutlined />}
          aria-label={t("schedule.preview.nextMonth")}
          onClick={() => setOffset((value) => value + 1)}
        />
      </div>
      <table aria-label={monthLabel}>
        <thead>
          <tr>
            {weekdays.map((label, index) => (
              <th key={index} scope="col">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: weekCount }, (_, week) => (
            <tr key={week}>
              {weekdays.map((_, index) => {
                const day = days[week * 7 + index - leadingDays];
                if (!day) return <td key={index} />;
                const inNextRuns = runs.some(
                  (run) => run >= day.start && run < day.end,
                );
                const marker = inNextRuns
                  ? "next"
                  : day.hasRun
                    ? "also"
                    : undefined;
                const legend =
                  marker === "next"
                    ? t("schedule.preview.nextRuns")
                    : t("schedule.preview.alsoRuns");
                const label = dateLabel.format(day.start);
                return (
                  <td
                    key={index}
                    data-run={marker}
                    aria-label={marker ? `${label}, ${legend}` : label}
                  >
                    {day.number}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="cron-preview__legend">
        <span data-run="next">{t("schedule.preview.nextRuns")}</span>
        <span data-run="also">{t("schedule.preview.alsoRuns")}</span>
      </div>
    </div>
  );
}
