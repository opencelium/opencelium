import { useMemo, useState } from "react";
import { Select } from "@shared/ui/primitives/Select";
import { Typography } from "@shared/ui/primitives/Typography";
import { useDialogFullscreen } from "@shared/ui/primitives/Dialog/DialogFullscreenContext";
import { DialogHeaderActions } from "@shared/ui/primitives/Dialog/DialogHeaderSlotContext";
import { useI18n } from "@shared/i18n/hooks/useI18n";
import { useGetLogFilesQuery } from "../api/logsApi";
import type { LogFileStatus } from "../model/types";
import { parseLogFileName } from "./parseLogFileName";
import { ExecutionLogTree } from "./ExecutionLogTree";
import { DownloadLogsButton } from "./DownloadLogsButton";
import { MethodDetailViewStateProvider } from "./methodDetailViewState";

type Props = {
  connectionId: number;
  schedulerId: number;
  status: LogFileStatus;
};

export function LogsDialogContent({ connectionId, schedulerId, status }: Props) {
  const { t } = useI18n("logs");
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
        // Newest execution first (highest executionId).
        .sort((a, b) => Number(b.executionId) - Number(a.executionId))
        .map((parsed) => ({ value: parsed.executionId, label: parsed.label })),
    [files],
  );

  return (
    <MethodDetailViewStateProvider>
      {executionId && (
        <DialogHeaderActions>
          <DownloadLogsButton executionId={executionId} />
        </DialogHeaderActions>
      )}
      <div
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
        <div style={{ marginBottom: 20 }}>
          <Typography variant="headline" as="h1">
            {t("title")}
          </Typography>
          <Typography variant="body" isSubtle>
            {t("subtitle")}
          </Typography>
        </div>

        <Typography variant="label">{t("selectLabel")}</Typography>
        <Select<string>
          value={executionId}
          onChange={setExecutionId}
          options={options}
          sortOptions={false}
          isLoading={isFetching}
          placeholder={t("selectPlaceholder")}
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
              {t("selectHint")}
            </Typography>
          )}
        </div>
      </div>
    </MethodDetailViewStateProvider>
  );
}
