import { useState } from "react";
import { Typography } from "@shared/ui/primitives/Typography";
import { useI18n } from "@shared/i18n/hooks/useI18n";
import type { FlowchartLog } from "../model/types";
import { LogRow } from "./logRowUi";
import { LogPlaygroundRootContext } from "./LogPlaygroundAction";
import { ElementChildren } from "./LogElementRow";

export function ConnectorLogRow({
  log,
  path,
}: {
  log: FlowchartLog;
  path: string;
}) {
  const [expanded, setExpanded] = useState(true);
  const { t } = useI18n("logs");

  return (
    <>
      <LogRow
        depth={0}
        expandable
        expanded={expanded}
        onToggle={() => setExpanded((v) => !v)}
        left={
          <Typography variant="label-sm" isBold isUppercase>
            {log.connectorName !== 'DEFAULT' ? log.connectorName : t("logsLabel")}
          </Typography>
        }
      />
      {expanded ? (
        <LogPlaygroundRootContext.Provider value={{ executionId: log.executionId, direction: log.properties.DIRECTION }}>
          <ElementChildren id={log.id} depth={1} path={path} />
        </LogPlaygroundRootContext.Provider>
      ) : null}
    </>
  );
}
