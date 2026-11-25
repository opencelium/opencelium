import { useI18n } from "@shared/i18n/hooks/useI18n";
import type { Marker } from "../calendarSlots";
import { isFailedMarker } from "./calendarGrid";
import { ScheduleRunPopover } from "./ScheduleRunPopover";
import { scheduleName } from "./scheduleName";

type Props = {
  hidden: Marker[];
  onShowDay: () => void;
};

/** A failed run must not vanish behind "+N more": the button then carries a dot and opens that run. */
export function CalendarMoreButton({ hidden, onShowDay }: Props) {
  const { t } = useI18n("entities");
  if (hidden.length === 0) return null;
  const failed = hidden.find(isFailedMarker);
  const names = [...new Set(hidden.map((marker) => scheduleName(marker.schedule)))].join(", ");
  const button = (
    <button
      type="button"
      className="schedule-calendar-more"
      data-failed={failed ? true : undefined}
      title={failed ? `${names} — ${t("schedule.calendar.moreFailed")}` : names}
      onClick={failed ? undefined : onShowDay}
      data-testid="schedule-calendar-more"
    >
      {failed && <span className="schedule-calendar-dot" aria-hidden />}
      {t("schedule.calendar.moreRuns", { count: hidden.length })}
    </button>
  );
  return failed ? <ScheduleRunPopover schedule={failed.schedule}>{button}</ScheduleRunPopover> : button;
}
