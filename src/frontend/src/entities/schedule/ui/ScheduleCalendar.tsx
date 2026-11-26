import { CronDate } from "cron-parser";
import { useMemo, useState } from "react";
import { getScheduleTimeZone } from "@shared/lib/cron/upcomingRuns";
import { useI18n } from "@shared/i18n/hooks/useI18n";
import { Button } from "@shared/ui/primitives/Button";
import { IconButton } from "@shared/ui/primitives/IconButton";
import { Tooltip } from "@shared/ui/primitives/Tooltip";
import type { Schedule } from "../model/types";
import { calendarDays, calendarSlots, moveCalendarDate, type CalendarView } from "./calendarSlots";
import { CalendarAgenda } from "./calendar/CalendarAgenda";
import { CalendarMonthGrid } from "./calendar/CalendarMonthGrid";
import { CalendarTimeGrid } from "./calendar/CalendarTimeGrid";
import { ScheduleViewTabs } from "./calendar/ScheduleViewTabs";
import { useCalendarFormats, type CalendarFormats } from "./calendar/useCalendarFormats";
import { useMinuteClock } from "./calendar/useMinuteClock";
import "./ScheduleCalendar.css";

const navigationKey = (view: CalendarView, direction: "prev" | "next") =>
  view === "week" ? `schedule.calendar.${direction}` : `schedule.calendar.${direction}_${view}`;

function rangeLabel(view: CalendarView, anchor: number, first: number, last: number, formats: CalendarFormats, zone: string) {
  if (view === "month") return formats.month.format(anchor);
  if (view === "day") return formats.fullDay.format(first);
  const sameYear = new CronDate(first, zone).getFullYear() === new CronDate(last, zone).getFullYear();
  return `${(sameYear ? formats.shortDate : formats.longDate).format(first)} – ${formats.longDate.format(last)}`;
}

export function ScheduleCalendar({ schedules, initialView = "week", onShowList }: {
  schedules: Schedule[];
  initialView?: CalendarView;
  onShowList?: () => void;
}) {
  const zone = getScheduleTimeZone();
  const { t, lang } = useI18n("entities");
  const formats = useCalendarFormats(lang, zone);
  const [view, setView] = useState<CalendarView>(initialView);
  const [anchor, setAnchor] = useState(Date.now);
  const days = useMemo(() => calendarDays(anchor, view, zone), [anchor, view, zone]);
  const visibleDays = days.slice(0, -1);
  const slots = useMemo(() => calendarSlots(schedules, days, zone), [schedules, days, zone]);
  const clock = useMinuteClock();
  const today = calendarDays(clock, "day", zone)[0];
  const dates = visibleDays.map((day) => new CronDate(day, zone));
  const weekend = dates.map((date) => date.getDay() === 0 || date.getDay() === 6);
  const nowDate = new CronDate(clock, zone);
  const todayIndex = visibleDays.indexOf(today);
  const now = todayIndex < 0 ? null : { dayIndex: todayIndex, hour: nowDate.getHours(), fraction: nowDate.getMinutes() / 60 };
  const showDay = (index: number) => {
    setAnchor(visibleDays[index]);
    setView("day");
  };
  const move = (step: number) => setAnchor((date) => moveCalendarDate(date, view, step, zone));

  return (
    <section className="schedule-calendar" data-view={view} data-testid="schedule-calendar" aria-label={t("schedule.calendar.title")}>
      <div className="schedule-calendar-toolbar">
        <ScheduleViewTabs value={view} includeList={Boolean(onShowList)}
          onChange={(next) => (next === "list" ? onShowList?.() : setView(next))} />
        <span className="schedule-calendar-nav">
          <Tooltip content={t(navigationKey(view, "prev"))}>
            <IconButton testId="schedule-calendar-prev" type="text" iconProps={{ name: "chevron-left" }} onClick={() => move(-1)} />
          </Tooltip>
          <Tooltip content={t(navigationKey(view, "next"))}>
            <IconButton testId="schedule-calendar-next" type="text" iconProps={{ name: "chevron-right" }} onClick={() => move(1)} />
          </Tooltip>
        </span>
        <Button testId="schedule-calendar-today" onClick={() => setAnchor(Date.now())}>
          {t("schedule.calendar.today")}
        </Button>
        <strong className="schedule-calendar-range" aria-live="polite">
          {rangeLabel(view, anchor, visibleDays[0], visibleDays[visibleDays.length - 1], formats, zone)}
        </strong>
        <span className="schedule-calendar-zone">{t("schedule.preview.zone", { zone })}</span>
      </div>
      {view === "month" ? (
        <CalendarMonthGrid
          days={visibleDays}
          weekend={weekend}
          outsideMonth={dates.map((date) => date.getMonth() !== new CronDate(anchor, zone).getMonth())}
          today={today}
          slots={slots}
          formats={formats}
          onShowDay={showDay}
        />
      ) : view === "agenda" ? (
        <CalendarAgenda days={visibleDays} today={today} slots={slots} formats={formats} />
      ) : (
        <CalendarTimeGrid
          key={view}
          days={visibleDays}
          weekend={weekend}
          today={today}
          now={now}
          slots={slots}
          isDayView={view === "day"}
          formats={formats}
          onShowDay={showDay}
        />
      )}
    </section>
  );
}
