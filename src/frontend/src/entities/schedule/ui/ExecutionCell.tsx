import { memo } from "react";
import { Button } from "@shared/ui/primitives/Button";
import { useDialog } from "@shared/ui/dialog/useDialog";
import { useI18n } from "@shared/i18n/hooks/useI18n";
import type { ScheduleExecutionRun } from "../model/types";
import { LogsDialogContent, type LogFileStatus } from "@features/logs";
import { formatExecutionDate } from "./formatExecutionDate";

type LogsContext = {
  connectionId: number;
  schedulerId: number;
  status: LogFileStatus;
};

type Props = {
  execution?: ScheduleExecutionRun;
  logs?: LogsContext;
};

export const ExecutionCell = memo(function ExecutionCell({
  execution,
  logs,
}: Props) {
  const dialog = useDialog();
  const { t: tEntities } = useI18n("entities");

  if (!execution || !execution.startTime) return <>-</>;

  const openLogs = () => {
    if (!logs) return;
    dialog.open({
      width: 900,
      maximizable: true,
      content: (
        <LogsDialogContent
          connectionId={logs.connectionId}
          schedulerId={logs.schedulerId}
          status={logs.status}
        />
      ),
    });
  };

  return (
    <div
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        lineHeight: 1.2,
      }}
    >
      <span>{formatExecutionDate(execution.startTime)}</span>
      {logs && execution.hasLog ? (
        <Button
          type="link"
          onClick={openLogs}
          style={{ padding: 0, height: "auto", fontSize: 12 }}
        >
          {tEntities("schedule.executionLogs.seeLogs")}
        </Button>
      ) : null}
    </div>
  );
});
