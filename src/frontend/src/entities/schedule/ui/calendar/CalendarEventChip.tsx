import { useI18n } from "@shared/i18n/hooks/useI18n";
import type { Marker } from "../calendarSlots";
import { formatCronLabel } from "../cronLabel";
import { isFailedMarker } from "./calendarGrid";
import { ScheduleRunPopover } from "./ScheduleRunPopover";
import { scheduleName } from "./scheduleName";
import { useScheduleChipStyle } from "./useScheduleColor";

type Props = {
  marker: Marker;
  time: string;
};

export function CalendarEventChip({ marker, time }: Props) {
  const { t, lang } = useI18n("entities");
  const styleOf = useScheduleChipStyle();
  const { schedule, cadence } = marker;
  const name = scheduleName(schedule);
  return (
    <ScheduleRunPopover schedule={schedule}>
      <button
        type="button"
        className="schedule-calendar-event"
        style={styleOf(schedule)}
        title={`${name} · ${formatCronLabel(schedule.cronExp, t, lang)}`}
        data-failed={isFailedMarker(marker) || undefined}
        data-testid={`schedule-calendar-event-${schedule.schedulerId}`}
      >
        <span className="schedule-calendar-event-time" data-cadence={cadence ? true : undefined}>
          {cadence ? t("schedule.calendar.every", { count: cadence }) : time}
        </span>
        <span className="schedule-calendar-event-name">{name}</span>
      </button>
    </ScheduleRunPopover>
  );
}
