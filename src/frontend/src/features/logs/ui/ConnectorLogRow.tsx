import { useState } from "react";
import { Typography } from "@shared/ui/primitives/Typography";
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

  return (
    <>
      <LogRow
        depth={0}
        expandable
        expanded={expanded}
        onToggle={() => setExpanded((v) => !v)}
        left={
          <Typography variant="label" isBold isUppercase>
            {log.connectorName !== 'DEFAULT' ? log.connectorName : 'WORKFLOW'}
          </Typography>
        }
      />
      {expanded ? <ElementChildren id={log.id} depth={1} path={path} /> : null}
    </>
  );
}
