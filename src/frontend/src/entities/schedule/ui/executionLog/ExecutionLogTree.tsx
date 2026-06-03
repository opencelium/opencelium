import { Loading } from "@shared/ui/primitives/Loading/Loading";
import { Typography } from "@shared/ui/primitives/Typography";
import { useI18n } from "@shared/i18n/hooks/useI18n";
import { useGetExecutionConnectorsQuery } from "../../api/executionLogApi";
import { ConnectorLogRow } from "./ConnectorLogRow";

export function ExecutionLogTree({
  executionId,
  fill = false,
}: {
  executionId: string;
  fill?: boolean;
}) {
  const { t: tEntities } = useI18n("entities");
  const { data, isFetching, isError } =
    useGetExecutionConnectorsQuery(executionId);

  if (isFetching) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 32 }}>
        <Loading size="md" inline />
      </div>
    );
  }
  if (isError || !data || data.length === 0) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <Typography variant="caption" isSubtle>
          {tEntities("schedule.executionLogs.empty")}
        </Typography>
      </div>
    );
  }

  return (
    <div
      style={{
        border: "1px solid var(--color-border-default)",
        borderRadius: 6,
        overflow: "auto",
        ...(fill ? { flex: 1, minHeight: 0 } : { maxHeight: "60vh" }),
      }}
    >
      {data.map((connector, index) => (
        <ConnectorLogRow
          key={connector.id}
          log={connector}
          path={String(index)}
        />
      ))}
    </div>
  );
}
