import type { CSSProperties } from "react";
import { getScheduleTimeZone, upcomingRuns } from "@shared/lib/cron/upcomingRuns";
import { useI18n } from "@shared/i18n/hooks/useI18n";
import { Button } from "@shared/ui/primitives/Button";
import { useSubscriptionIssue } from "@entities/subscription/model/useSubscriptionIssue";
import type { Schedule } from "../../model/types";
import { useScheduleUpdatePermission } from "../../model/useScheduleUpdatePermission";
import { formatCronLabel, formatDuration, formatRemaining } from "../cronLabel";
import { formatExecutionDate } from "../formatExecutionDate";
import { useRunScheduleNow } from "../useRunScheduleNow";
import { scheduleName } from "./scheduleName";
import { useMinuteClock } from "./useMinuteClock";
import "./ScheduleRunCard.css";

type Props = {
  schedule: Schedule;
  color: string;
  onOpen: () => void;
};

export function ScheduleRunCard({ schedule, color, onOpen }: Props) {
  const { t, lang } = useI18n("entities");
  const { t: tCommon } = useI18n("common");
  const canUpdate = useScheduleUpdatePermission();
  const { issue } = useSubscriptionIssue();
  const runNow = useRunScheduleNow(schedule.schedulerId);
  const cron = schedule.cronExp?.trim() ?? "";
  const now = useMinuteClock();
  const nextRun = cron ? upcomingRuns(cron, now, 1, getScheduleTimeZone())?.[0] : undefined;
  const { success, fail } = schedule.lastExecution ?? {};
  const testId = (part: string) => `schedule-run-${part}-${schedule.schedulerId}`;

  return (
    <div className="schedule-run" style={{ "--schedule-color": color } as CSSProperties} data-testid={testId("card")}>
      <div className="schedule-run-head">
        <strong>{scheduleName(schedule)}</strong>
        {scheduleName(schedule) !== schedule.connection.title && <span>{schedule.connection.title}</span>}
      </div>
      <div className="schedule-run-body">
        <div className="schedule-run-when">
          <strong>{cron ? formatCronLabel(cron, t, lang) : "–"}</strong>
          <span>{nextRun ? t("schedule.run.nextIn", { duration: formatRemaining(nextRun - now) }) : t("schedule.run.noNext")}</span>
        </div>
        <dl>
          <dt>{t("schedule.run.lastRun")}</dt>
          <dd>{success ? `${formatExecutionDate(success.startTime)} · ${formatDuration(success.duration)}` : "–"}</dd>
          {fail && (
            <>
              <dt>{t("schedule.run.lastFailure")}</dt>
              <dd data-tone="error">{formatExecutionDate(fail.startTime)}</dd>
            </>
          )}
          <dt>{t("schedule.run.duration")}</dt>
          <dd>{t("schedule.calendar.card.avgDuration", { duration: formatDuration(success?.duration) })}</dd>
        </dl>
        {schedule.debugMode && <span className="schedule-run-badge" data-tone="warning">{t("schedule.run.debug")}</span>}
        {cron && (
          <details>
            <summary>{t("schedule.run.cron")}</summary>
            <code>{cron}</code>
            <span>{t("schedule.run.cronHint")}</span>
          </details>
        )}
      </div>
      <div className="schedule-run-foot">
        <Button type="primary" testId={testId("open")} onClick={onOpen}>
          {tCommon(canUpdate ? "actions.edit" : "actions.view")}
        </Button>
        <Button testId={testId("now")} loading={runNow.pending} disabled={Boolean(issue)} onClick={runNow.run}>
          {t("schedule.run.runNow")}
        </Button>
      </div>
    </div>
  );
}
