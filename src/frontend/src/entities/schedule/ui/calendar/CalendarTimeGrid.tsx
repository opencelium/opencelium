import { useState, type CSSProperties } from "react";
import { useI18n } from "@shared/i18n/hooks/useI18n";
import { cellMarkers, hourLabel, hourRows, type Slots } from "./calendarGrid";
import { CalendarDayHeader } from "./CalendarDayHeader";
import { CalendarHourRow, type NowPosition } from "./CalendarHourRow";
import type { CalendarFormats } from "./useCalendarFormats";

type Props = {
  days: number[];
  weekend: boolean[];
  today: number;
  now: NowPosition | null;
  slots: Slots;
  isDayView: boolean;
  formats: CalendarFormats;
  onShowDay: (dayIndex: number) => void;
};

export function CalendarTimeGrid({ days, weekend, today, now, slots, isDayView, formats, onShowDay }: Props) {
  const { t } = useI18n("entities");
  const [openBands, setOpenBands] = useState<ReadonlySet<number>>(new Set());
  const rows = hourRows((hour) => days.some((_, index) => cellMarkers(slots, index, hour).length > 0));
  const toggleBand = (from: number) =>
    setOpenBands((current) => {
      const next = new Set(current);
      if (!next.delete(from)) next.add(from);
      return next;
    });
  const renderHour = (hour: number) => (
    <CalendarHourRow
      key={hour}
      hour={hour}
      days={days}
      weekend={weekend}
      slots={slots}
      isDayView={isDayView}
      now={now}
      formats={formats}
      onShowDay={onShowDay}
    />
  );
  return (
    <div className="schedule-calendar-scroll">
      <div
        className="schedule-calendar-grid"
        role="grid"
        data-day-view={isDayView || undefined}
        style={{ "--day-count": days.length } as CSSProperties}
      >
        <div className="schedule-calendar-head schedule-calendar-corner" aria-hidden />
        {days.map((day, index) => (
          <CalendarDayHeader key={day} day={day} index={index} slots={slots} isToday={day === today} formats={formats} />
        ))}
        {rows.map((row) => {
          if (row.kind === "hour") return renderHour(row.hour);
          const isOpen = openBands.has(row.from);
          return [
            <button
              key={`band-${row.from}`}
              type="button"
              className="schedule-calendar-band"
              aria-expanded={isOpen}
              onClick={() => toggleBand(row.from)}
              data-testid={`schedule-calendar-band-${row.from}`}
            >
              <span className="schedule-calendar-band-chevron" aria-hidden>›</span>
              <span>{`${hourLabel(row.from)} – ${hourLabel(row.to)}`}</span>
              <span className="schedule-calendar-band-note">
                {t("schedule.calendar.quietHours", { count: row.to - row.from })}
              </span>
            </button>,
            ...(isOpen ? Array.from({ length: row.to - row.from }, (_, offset) => renderHour(row.from + offset)) : []),
          ];
        })}
      </div>
    </div>
  );
}
