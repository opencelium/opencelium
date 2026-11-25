import { useI18n } from "@shared/i18n/hooks/useI18n";
import { hourRunCounts, type Slots } from "./calendarGrid";
import type { CalendarFormats } from "./useCalendarFormats";
import { LoadBars } from "./LoadBars";

type Props = {
  day: number;
  index: number;
  slots: Slots;
  isToday: boolean;
  formats: CalendarFormats;
};

export function CalendarDayHeader({ day, index, slots, isToday, formats }: Props) {
  const { t } = useI18n("entities");
  const counts = hourRunCounts(slots, index);
  const total = counts.reduce((sum, count) => sum + count, 0);
  return (
    <div
      className="schedule-calendar-head"
      role="columnheader"
      aria-label={formats.fullDay.format(day)}
      aria-current={isToday ? "date" : undefined}
    >
      <div className="schedule-calendar-head-top">
        <span className="schedule-calendar-head-dow">{formats.weekday.format(day)}</span>
        <span className="schedule-calendar-head-day">{formats.dayNumber.format(day)}</span>
        {total > 0 && (
          <span className="schedule-calendar-head-count" title={t("schedule.calendar.runsOnDay", { count: total })}>
            {total}×
          </span>
        )}
      </div>
      <LoadBars counts={counts} className="schedule-calendar-load" />
    </div>
  );
}
