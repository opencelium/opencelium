import type { CSSProperties } from "react";
import { useI18n } from "@shared/i18n/hooks/useI18n";
import { cellMarkers, hasClash, hourLabel, type Slots } from "./calendarGrid";
import { CalendarEventChip } from "./CalendarEventChip";
import { CalendarMoreButton } from "./CalendarMoreButton";
import type { CalendarFormats } from "./useCalendarFormats";

const VISIBLE_PER_CELL = 2;

export type NowPosition = { dayIndex: number; hour: number; fraction: number };

type Props = {
  hour: number;
  days: number[];
  weekend: boolean[];
  slots: Slots;
  isDayView: boolean;
  now: NowPosition | null;
  formats: CalendarFormats;
  onShowDay: (dayIndex: number) => void;
};

export function CalendarHourRow({ hour, days, weekend, slots, isDayView, now, formats, onShowDay }: Props) {
  const { t } = useI18n("entities");
  const cells = days.map((_, index) => cellMarkers(slots, index, hour));
  const clashes = cells.map(hasClash);
  const hasAnyClash = clashes.some(Boolean);
  return (
    <>
      <div
        className="schedule-calendar-hour"
        role="rowheader"
        data-clash={hasAnyClash || undefined}
        title={hasAnyClash ? t("schedule.calendar.clash") : undefined}
      >
        {hourLabel(hour)}
      </div>
      {cells.map((markers, index) => {
        const visible = isDayView ? markers : markers.slice(0, VISIBLE_PER_CELL);
        const isNow = now?.dayIndex === index && now.hour === hour;
        return (
          <div
            key={days[index]}
            role="gridcell"
            className="schedule-calendar-cell"
            data-weekend={weekend[index] || undefined}
            data-overlap={clashes[index] || undefined}
            data-now={isNow || undefined}
            style={isNow ? ({ "--now-offset": `${now.fraction * 100}%` } as CSSProperties) : undefined}
          >
            {visible.map((marker) => (
              <CalendarEventChip
                key={marker.schedule.schedulerId + ":" + marker.time}
                marker={marker}
                time={formats.time.format(marker.time)}
              />
            ))}
            <CalendarMoreButton hidden={markers.slice(visible.length)} onShowDay={() => onShowDay(index)} />
          </div>
        );
      })}
    </>
  );
}
