import { Segmented } from "antd";
import { useI18n } from "@shared/i18n/hooks/useI18n";
import type { ScheduleView } from "../calendarSlots";

const VIEWS: ScheduleView[] = ["list", "day", "week", "month", "agenda"];

type Props = {
  value: ScheduleView;
  onChange: (view: ScheduleView) => void;
  includeList?: boolean;
};

export function ScheduleViewTabs({ value, onChange, includeList = true }: Props) {
  const { t } = useI18n("entities");
  return (
    <Segmented<ScheduleView>
      value={value}
      onChange={onChange}
      aria-label={t("schedule.calendar.views")}
      data-testid="schedule-calendar-view"
      options={VIEWS.filter((view) => includeList || view !== "list").map((view) => ({
        value: view,
        label: <span data-testid={`schedule-calendar-view-${view}`}>{t(`schedule.calendar.${view}`)}</span>,
      }))}
    />
  );
}
