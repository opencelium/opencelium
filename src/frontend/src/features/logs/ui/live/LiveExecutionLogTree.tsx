import { useState } from "react";
import { Typography } from "@shared/ui/primitives/Typography";
import { useI18n } from "@shared/i18n/hooks/useI18n";
import type { LiveLogNode, LiveLogTree } from "../../model/liveLogTree";
import { LogRow } from "../logRowUi";
import { MethodDetailViewStateProvider } from "../methodDetailViewState";
import { LiveChildren, LiveStatusIndicator } from "./LiveLogElementRow";

function LiveConnectorRow({ tree, node }: { tree: LiveLogTree; node: LiveLogNode }) {
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
            {node.connectorName !== "DEFAULT" ? node.connectorName : "WORKFLOW"}
          </Typography>
        }
        right={<LiveStatusIndicator status={node.status} />}
      />
      {expanded ? (
        <LiveChildren tree={tree} childKeys={node.childKeys} depth={1} />
      ) : null}
    </>
  );
}

// Same look as ExecutionLogTree, but rendered entirely from the live socket
// stream (LiveLogTree) — used by the workflow test-run panel.
export function LiveExecutionLogTree({
  tree,
  fill = false,
}: {
  tree: LiveLogTree;
  fill?: boolean;
}) {
  const { t } = useI18n("logs");

  if (tree.rootKeys.length === 0) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <Typography variant="caption" isSubtle>
          {t("empty")}
        </Typography>
      </div>
    );
  }

  return (
    <MethodDetailViewStateProvider>
      <div
        style={{
          border: "1px solid var(--color-border-default)",
          borderRadius: 6,
          overflow: "auto",
          ...(fill ? { flex: 1, minHeight: 0 } : { maxHeight: "60vh" }),
        }}
      >
        {tree.rootKeys.map((key) => {
          const node = tree.nodes[key];
          return node ? (
            <LiveConnectorRow key={key} tree={tree} node={node} />
          ) : null;
        })}
      </div>
    </MethodDetailViewStateProvider>
  );
}
