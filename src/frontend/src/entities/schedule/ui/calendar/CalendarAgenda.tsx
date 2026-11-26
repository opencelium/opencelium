import type { CSSProperties } from "react";
import { useI18n } from "@shared/i18n/hooks/useI18n";
import { lastRunOutcome } from "../../model/lastRunOutcome";
import type { Schedule } from "../../model/types";
import type { Marker } from "../calendarSlots";
import { formatCronLabel } from "../cronLabel";
import { agendaMarkers, type Slots } from "./calendarGrid";
import { ScheduleRunPopover } from "./ScheduleRunPopover";
import { scheduleName } from "./scheduleName";
import type { CalendarFormats } from "./useCalendarFormats";
import { useScheduleColor } from "./useScheduleColor";

const DAY_MS = 86_400_000;

type Props = {
  days: number[];
  today: number;
  slots: Slots;
  formats: CalendarFormats;
};

function StatusPill({ schedule }: { schedule: Schedule }) {
  const { t } = useI18n("entities");
  const outcome = lastRunOutcome(schedule);
  if (outcome === null) return null;
  return outcome === "success"
    ? <span className="schedule-calendar-pill" data-tone="success">{t("schedule.run.lastOk")}</span>
    : <span className="schedule-calendar-pill" data-tone="error">{t("schedule.run.lastFailed")}</span>;
}

export function CalendarAgenda({ days, today, slots, formats }: Props) {
  const { t, lang } = useI18n("entities");
  const colorOf = useScheduleColor();
  const groups = days
    .map((day, index) => ({ day, markers: agendaMarkers(slots, index) }))
    .filter((group) => group.markers.length > 0);
  if (groups.length === 0) return <p className="schedule-calendar-empty">{t("schedule.calendar.noRuns")}</p>;

  const renderRow = ({ schedule, time, cadence }: Marker) => (
    <ScheduleRunPopover key={schedule.schedulerId + ":" + time} schedule={schedule}>
      <button
        type="button"
        className="schedule-calendar-agenda-row"
        style={{ "--schedule-color": colorOf(schedule) } as CSSProperties}
        data-testid={`schedule-calendar-event-${schedule.schedulerId}`}
      >
        <span className="schedule-calendar-agenda-time">{formats.time.format(time)}</span>
        <span className="schedule-calendar-swatch" aria-hidden />
        <span className="schedule-calendar-agenda-title">
          {scheduleName(schedule)}
          {scheduleName(schedule) !== schedule.connection.title && <span> · {schedule.connection.title}</span>}
        </span>
        <code>{cadence ? t("schedule.calendar.every", { count: cadence }) : formatCronLabel(schedule.cronExp, t, lang)}</code>
        <StatusPill schedule={schedule} />
      </button>
    </ScheduleRunPopover>
  );

  return (
    <div className="schedule-calendar-scroll">
      <div className="schedule-calendar-agenda">
        {groups.map(({ day, markers }) => (
          <section key={day} aria-label={formats.longDay.format(day)}>
            <h4 className="schedule-calendar-agenda-day">
              <strong>{formats.longDay.format(day)}</strong>
              <span>{formats.relativeDays.format(Math.round((day - today) / DAY_MS), "day")}</span>
            </h4>
            {markers.map(renderRow)}
          </section>
        ))}
      </div>
    </div>
  );
}
