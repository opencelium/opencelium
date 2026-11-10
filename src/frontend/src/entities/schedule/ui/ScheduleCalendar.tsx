import { useMemo, useState } from "react";
import { getScheduleTimeZone } from "@shared/lib/cron/upcomingRuns";
import { Link } from "react-router-dom";
import { Button } from "@shared/ui/primitives/Button";
import { useI18n } from "@shared/i18n/hooks/useI18n";
import { useScheduleUpdatePermission } from "../model/useScheduleUpdatePermission";
import type { Schedule } from "../model/types";
import { calendarSlots, weekDays } from "./calendarSlots";
import "./ScheduleCalendar.css";

export function ScheduleCalendar({ schedules }: { schedules: Schedule[] }) {
  const zone = getScheduleTimeZone();
  const { t, lang } = useI18n("entities");
  const canUpdate = useScheduleUpdatePermission();
  const [week, setWeek] = useState(0);
  const days = useMemo(() => weekDays(week, zone), [week, zone]);
  const slots = useMemo(
    () =>
      calendarSlots(
        schedules.filter((schedule) => schedule.status),
        days,
        zone,
      ),
    [schedules, days, zone],
  );
  const dayFormat = new Intl.DateTimeFormat(lang, {
    timeZone: zone,
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const timeFormat = new Intl.DateTimeFormat(lang, {
    timeZone: zone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  return (
    <section
      className="schedule-calendar"
      data-testid="schedule-calendar"
      aria-label={t("schedule.calendar.title")}
    >
      <div className="schedule-calendar-toolbar">
        <Button
          testId="schedule-calendar-prev"
          onClick={() => setWeek((value) => value - 1)}
        >
          {t("schedule.calendar.prev")}
        </Button>
        <Button
          testId="schedule-calendar-next"
          onClick={() => setWeek((value) => value + 1)}
        >
          {t("schedule.calendar.next")}
        </Button>
      </div>
      <p>{t("schedule.preview.zone", { zone })}</p>
      <div className="schedule-calendar-scroll">
        <table>
          <thead>
            <tr>
              <th scope="col">{t("schedule.calendar.hour")}</th>
              {days.slice(0, 7).map((day) => (
                <th key={day} scope="col">
                  {dayFormat.format(day)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 24 }, (_, hour) => (
              <tr key={hour}>
                <th scope="row">{String(hour).padStart(2, "0")}:00</th>
                {days.slice(0, 7).map((day, index) => {
                  const markers = slots.get(index + ":" + hour) ?? [];
                  const overlap =
                    new Set(markers.map((marker) => marker.schedule.schedulerId))
                      .size > 1;
                  return (
                    <td
                      key={day}
                      className={
                        overlap ? "schedule-calendar-overlap" : undefined
                      }
                      data-overlap={overlap || undefined}
                    >
                      {markers.map(({ schedule, time, cadence, more }) => (
                        <Link
                          key={schedule.schedulerId + ":" + time}
                          to={`/schedule/${canUpdate ? "update" : "view"}/${schedule.schedulerId}`}
                        >
                          {schedule.title || schedule.connection.title}
                          {" · "}
                          {cadence
                            ? t("schedule.calendar.every", { count: cadence })
                            : timeFormat.format(time)}
                          {more &&
                            !cadence &&
                            " · " + t("schedule.calendar.more")}
                        </Link>
                      ))}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
