import { dayMarkers, hourRunCounts, type Slots } from "./calendarGrid";
import { CalendarEventChip } from "./CalendarEventChip";
import { CalendarMoreButton } from "./CalendarMoreButton";
import { LoadBars } from "./LoadBars";
import type { CalendarFormats } from "./useCalendarFormats";

const VISIBLE_PER_DAY = 2;
// 2024-01-01 was a Monday, so these are Monday-first weekday names.
const WEEK = Array.from({ length: 7 }, (_, index) => Date.UTC(2024, 0, index + 1));

type Props = {
  days: number[];
  weekend: boolean[];
  outsideMonth: boolean[];
  today: number;
  slots: Slots;
  formats: CalendarFormats;
  onShowDay: (dayIndex: number) => void;
};

export function CalendarMonthGrid({ days, weekend, outsideMonth, today, slots, formats, onShowDay }: Props) {
  return (
    <div className="schedule-calendar-scroll">
      <div className="schedule-calendar-month" role="grid">
        {WEEK.map((day) => (
          <div key={day} role="columnheader" className="schedule-calendar-month-head">
            {formats.weekdayName.format(day)}
          </div>
        ))}
        {days.map((day, index) => {
          const markers = dayMarkers(slots, index);
          const isToday = day === today;
          return (
            <div
              key={day}
              role="gridcell"
              className="schedule-calendar-month-cell"
              data-weekend={weekend[index] || undefined}
              data-outside-month={outsideMonth[index] || undefined}
            >
              <button
                type="button"
                className="schedule-calendar-month-day"
                aria-current={isToday ? "date" : undefined}
                aria-label={formats.fullDay.format(day)}
                onClick={() => onShowDay(index)}
              >
                {formats.dayNumber.format(day)}
              </button>
              {markers.slice(0, VISIBLE_PER_DAY).map((marker) => (
                <CalendarEventChip
                  key={marker.schedule.schedulerId}
                  marker={marker}
                  time={formats.time.format(marker.time)}
                />
              ))}
              <CalendarMoreButton hidden={markers.slice(VISIBLE_PER_DAY)} onShowDay={() => onShowDay(index)} />
              <LoadBars counts={hourRunCounts(slots, index)} className="schedule-calendar-month-load" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
