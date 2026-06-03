import { useMemo, useRef, useState } from "react";
import { Select } from "@shared/ui/primitives/Select";
import { Typography } from "@shared/ui/primitives/Typography";
import { StepHeader } from "@shared/ui/step-form/StepHeader";
import { useDialogFullscreen } from "@shared/ui/primitives/Dialog/DialogFullscreenContext";
import { useI18n } from "@shared/i18n/hooks/useI18n";
import { useGetLogFilesQuery } from "../../api/executionLogApi";
import type { LogFileStatus } from "../../model/executionLog.types";
import { parseLogFileName } from "./parseLogFileName";
import { ExecutionLogTree } from "./ExecutionLogTree";
import { MethodDetailViewStateProvider } from "./methodDetailViewState";

type Props = {
  connectionId: number;
  schedulerId: number;
  status: LogFileStatus;
};

export function LogsDialogContent({
  connectionId,
  schedulerId,
  status,
}: Props) {
  const { t: tEntities } = useI18n("entities");
  const containerRef = useRef<HTMLDivElement>(null);
  const [executionId, setExecutionId] = useState<string>();
  const isFullscreen = useDialogFullscreen();

  const { data: files, isFetching } = useGetLogFilesQuery({
    connectionId,
    schedulerId,
    status,
  });

  const options = useMemo(
    () =>
      (files ?? [])
        .map(parseLogFileName)
        .filter(
          (parsed): parsed is NonNullable<typeof parsed> => parsed !== null,
        )
        .map((parsed) => ({ value: parsed.executionId, label: parsed.label })),
    [files],
  );

  return (
    <MethodDetailViewStateProvider>
      <div
        ref={containerRef}
        style={
          isFullscreen
            ? {
                display: "flex",
                flexDirection: "column",
                height: "100%",
                minHeight: 0,
              }
            : undefined
        }
      >
        <StepHeader
          containerRef={containerRef}
          header="schedule.executionLogs.title"
          subheader="schedule.executionLogs.subtitle"
        />

        <Typography variant="label">
          {tEntities("schedule.executionLogs.selectLabel")}
        </Typography>
        <Select<string>
          value={executionId}
          onChange={setExecutionId}
          options={options}
          isLoading={isFetching}
          placeholder={tEntities("schedule.executionLogs.selectPlaceholder")}
        />

        <div
          style={{
            marginTop: 16,
            ...(isFullscreen
              ? {
                  flex: 1,
                  minHeight: 0,
                  display: "flex",
                  flexDirection: "column",
                }
              : {}),
          }}
        >
          {executionId ? (
            <ExecutionLogTree executionId={executionId} fill={isFullscreen} />
          ) : (
            <Typography variant="caption" isSubtle>
              {tEntities("schedule.executionLogs.selectHint")}
            </Typography>
          )}
        </div>
      </div>
    </MethodDetailViewStateProvider>
  );
}
