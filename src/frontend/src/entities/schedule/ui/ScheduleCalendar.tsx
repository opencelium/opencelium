import { AppstoreOutlined, BarsOutlined, CalendarOutlined, CheckOutlined, DownOutlined, LayoutOutlined, PicLeftOutlined, TableOutlined } from "@ant-design/icons";
import { Dropdown, type MenuProps } from "antd";
import { CronDate } from "cron-parser";
import { useMemo, useState } from "react";
import { getScheduleTimeZone } from "@shared/lib/cron/upcomingRuns";
import { Button } from "@shared/ui/primitives/Button";
import { useI18n } from "@shared/i18n/hooks/useI18n";
import type { Schedule } from "../model/types";
import { calendarDays, calendarSlots, moveCalendarDate, type CalendarView } from "./calendarSlots";
import { useOpenScheduleDialog } from "./useOpenScheduleDialog";
import "./ScheduleCalendar.css";

const calendarViews = {
  day: CalendarOutlined,
  three: TableOutlined,
  work: LayoutOutlined,
  week: PicLeftOutlined,
  month: AppstoreOutlined,
  list: BarsOutlined,
} satisfies Record<CalendarView | "list", typeof CalendarOutlined>;
const viewOrder: (CalendarView | "list")[] = ["day", "three", "work", "week", "month", "list"];

export function ScheduleViewMenu({ view, onChange }: {
  view: CalendarView | "list";
  onChange: (view: CalendarView | "list") => void;
}) {
  const { t } = useI18n("entities");
  const [viewMenuOpen, setViewMenuOpen] = useState(false);
  const ViewIcon = calendarViews[view];
  const viewItems: MenuProps["items"] = viewOrder.flatMap((option): NonNullable<MenuProps["items"]> => {
    const Icon = calendarViews[option];
    const item = {
      key: option,
      icon: <Icon />,
      label: <span className="schedule-calendar-view-option">
        {t(`schedule.calendar.${option}`)}
        {view === option && <CheckOutlined aria-hidden />}
      </span>,
    };
    return option === "list" ? [{ type: "divider" }, item] : [item];
  });
  return (
    <Dropdown
      trigger={["click"]}
      placement="bottomLeft"
      open={viewMenuOpen}
      onOpenChange={setViewMenuOpen}
      menu={{
        items: viewItems,
        selectable: true,
        selectedKeys: [view],
        onClick: ({ key }) => {
          onChange(key as CalendarView | "list");
          setViewMenuOpen(false);
        },
      }}
    >
      <button
        type="button"
        className="schedule-calendar-view"
        data-testid="schedule-calendar-view"
        aria-label={t("schedule.calendar.view")}
        aria-haspopup="menu"
        aria-expanded={viewMenuOpen}
      >
        <ViewIcon aria-hidden />
        <span>{t(`schedule.calendar.${view}`)}</span>
        <DownOutlined className="schedule-calendar-view-chevron" aria-hidden />
      </button>
    </Dropdown>
  );
}

export function ScheduleCalendar({ schedules, initialView = "week", onShowList }: {
  schedules: Schedule[];
  initialView?: CalendarView;
  onShowList: () => void;
}) {
  const zone = getScheduleTimeZone();
  const { t, lang } = useI18n("entities");
  const openSchedule = useOpenScheduleDialog();
  const [view, setView] = useState<CalendarView>(initialView);
  const [anchor, setAnchor] = useState(Date.now);
  const days = useMemo(() => calendarDays(anchor, view, zone), [anchor, view, zone]);
  const visibleDays = days.slice(0, -1);
  const slots = useMemo(() => calendarSlots(schedules, days, zone), [schedules, days, zone]);
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
  const rangeFormat = new Intl.DateTimeFormat(lang, {
    timeZone: zone, month: "short", day: "numeric", year: "numeric",
  });
  const shortDateFormat = new Intl.DateTimeFormat(lang, {
    timeZone: zone, month: "short", day: "numeric",
  });
  const lastDay = visibleDays[visibleDays.length - 1];
  const firstDay = days[0];
  const sameYear = new CronDate(firstDay, zone).getFullYear() === new CronDate(lastDay, zone).getFullYear();
  const rangeLabel = firstDay === lastDay
    ? dayFormat.format(firstDay)
    : `${(sameYear ? shortDateFormat : rangeFormat).format(firstDay)} – ${rangeFormat.format(lastDay)}`;
  const today = calendarDays(Date.now(), "day", zone)[0];
  const monthFormat = new Intl.DateTimeFormat(lang, { timeZone: zone, month: "long", year: "numeric" });
  const dateFormat = new Intl.DateTimeFormat(lang, { timeZone: zone, day: "numeric" });
  const weekdayFormat = new Intl.DateTimeFormat(lang, { timeZone: "UTC", weekday: "short" });
  const weekdayNames = Array.from({ length: 7 }, (_, index) =>
    weekdayFormat.format(Date.UTC(2024, 0, index + 1)),
  );
  const activeMonth = new CronDate(anchor, zone).getMonth();
  const navigationUnit = view === "work" ? "week" : view;
  const renderMarker = ({ schedule, time, cadence, more }: NonNullable<ReturnType<typeof slots.get>>[number]) => (
    <button
      type="button"
      key={schedule.schedulerId + ":" + time}
      className="schedule-calendar-event"
      data-disabled={!schedule.status || undefined}
      data-testid={`schedule-calendar-event-${schedule.schedulerId}`}
      onClick={() => openSchedule(schedule.schedulerId)}
    >
      {view === "month" && !cadence && timeFormat.format(time) + " "}
      {schedule.title || schedule.connection.title}
      {cadence && " · " + t("schedule.calendar.every", { count: cadence })}
      {view !== "month" && !cadence && " · " + timeFormat.format(time)}
      {more && !cadence && " · " + t("schedule.calendar.more")}
    </button>
  );
  return (
    <section
      className="schedule-calendar"
      data-view={view}
      data-testid="schedule-calendar"
      aria-label={t("schedule.calendar.title")}
    >
      <div className="schedule-calendar-toolbar">
        <ScheduleViewMenu view={view} onChange={(next) => next === "list" ? onShowList() : setView(next)} />
        <Button testId="schedule-calendar-prev" onClick={() => setAnchor((date) => moveCalendarDate(date, view, -1, zone))}>
          {t(navigationUnit === "week" ? "schedule.calendar.prev" : `schedule.calendar.prev_${navigationUnit}`)}
        </Button>
        <Button testId="schedule-calendar-today" onClick={() => setAnchor(Date.now())}>
          {t("schedule.calendar.today")}
        </Button>
        <Button testId="schedule-calendar-next" onClick={() => setAnchor((date) => moveCalendarDate(date, view, 1, zone))}>
          {t(navigationUnit === "week" ? "schedule.calendar.next" : `schedule.calendar.next_${navigationUnit}`)}
        </Button>
        <strong aria-live="polite">
          {view === "month" ? monthFormat.format(anchor) : rangeLabel}
        </strong>
      </div>
      <p>{t("schedule.preview.zone", { zone })}</p>
      <div className="schedule-calendar-scroll">
        {view === "month" ? (
          <table className="schedule-calendar-month">
            <thead><tr>{weekdayNames.map((name) => <th key={name} scope="col">{name}</th>)}</tr></thead>
            <tbody>
              {Array.from({ length: visibleDays.length / 7 }, (_, week) => (
                <tr key={week}>
                  {visibleDays.slice(week * 7, week * 7 + 7).map((day, column) => {
                    const index = week * 7 + column;
                    const markers = new Map<number, Parameters<typeof renderMarker>[0]>();
                    let overlap = false;
                    for (let hour = 0; hour < 24; hour++) {
                      const hourlyMarkers = slots.get(index + ":" + hour) ?? [];
                      overlap ||= new Set(hourlyMarkers.map(({ schedule }) => schedule.schedulerId)).size > 1;
                      for (const marker of hourlyMarkers) {
                        const first = markers.get(marker.schedule.schedulerId);
                        markers.set(marker.schedule.schedulerId, first ? { ...first, more: true } : marker);
                      }
                    }
                    const outsideMonth = new CronDate(day, zone).getMonth() !== activeMonth;
                    return (
                      <td key={day} data-outside-month={outsideMonth || undefined} className={overlap ? "schedule-calendar-overlap" : undefined} data-overlap={overlap || undefined}>
                        <strong aria-current={day === today ? "date" : undefined} aria-label={dayFormat.format(day)}>{dateFormat.format(day)}</strong>
                        {[...markers.values()].map(renderMarker)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className={view === "day" ? "schedule-calendar-day" : undefined}>
            <thead>
              <tr>
                <th scope="col">{t("schedule.calendar.hour")}</th>
                {visibleDays.map((day) => (
                  <th key={day} scope="col" aria-current={day === today ? "date" : undefined}>
                    {dayFormat.format(day)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 24 }, (_, hour) => (
                <tr key={hour}>
                  <th scope="row">{String(hour).padStart(2, "0")}:00</th>
                  {visibleDays.map((day, index) => {
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
                        {markers.map(renderMarker)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
