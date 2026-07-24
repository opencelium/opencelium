import { useState } from "react";
import { Typography } from "@shared/ui/primitives/Typography";
import { useI18n } from "@shared/i18n/hooks/useI18n";
import type { FlowchartLog } from "../model/types";
import { LogRow } from "./logRowUi";
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
            {log.connectorName !== 'DEFAULT' ? log.connectorName : t("testRunDetails")}
          </Typography>
        }
      />
      {expanded ? <ElementChildren id={log.id} depth={1} path={path} /> : null}
    </>
  );
}
