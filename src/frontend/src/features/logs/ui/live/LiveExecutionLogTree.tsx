import { useEffect, useMemo, useState } from "react";
import { Typography } from "@shared/ui/primitives/Typography";
import { useI18n } from "@shared/i18n/hooks/useI18n";
import {
  isErrorTarget,
  loopRevealIteration,
  makeErrorTraceMatcher,
  type LiveLogNode,
  type LiveLogTree,
} from "../../model/liveLogTree";
import { LogRow, Meta, TraceDot } from "../logRowUi";
import { MethodDetailViewStateProvider } from "../methodDetailViewState";
import { LiveChildren, LiveStatusIndicator } from "./LiveLogElementRow";
import {
  LogErrorTraceContext,
  useLogErrorTrace,
  type LogErrorTrace,
} from "../logErrorTrace";

function LiveConnectorRow({ tree, node }: { tree: LiveLogTree; node: LiveLogNode }) {
  const [expanded, setExpanded] = useState(true);
  const { t } = useI18n("logs");
  const { nonce, isOnTrace } = useLogErrorTrace();
  const onTrace = isOnTrace(node.indexPath, node.loopIndex) && node.status !== "FAIL";

  // Re-open a connector the user had collapsed when a run fails (the error trail
  // starts at the connector root).
  useEffect(() => {
    if (nonce > 0) setExpanded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nonce]);

  return (
    <>
      <LogRow
        depth={0}
        expandable
        expanded={expanded}
        onToggle={() => setExpanded((v) => !v)}
        left={
          <Typography variant="label-sm" isBold isUppercase>
            {node.connectorName !== "DEFAULT" ? node.connectorName : t("testRunDetails")}
          </Typography>
        }
        right={
          <Meta>
            {onTrace ? <TraceDot /> : null}
            <LiveStatusIndicator status={node.status} />
          </Meta>
        }
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
  revealNonce = 0,
}: {
  tree: LiveLogTree;
  fill?: boolean;
  // Bumped by the test-run provider when a run fails; triggers the tree to page
  // loops to the failing iterations and expand down to the failing element.
  revealNonce?: number;
}) {
  const { t } = useI18n("logs");

  const errorCtx = useMemo<LogErrorTrace>(() => {
    const matcher = makeErrorTraceMatcher(tree.errorLocations);
    return {
      nonce: revealNonce,
      isOnTrace: matcher,
      isTarget: (indexPath, loopIndexPath) =>
        isErrorTarget(tree.errorLocations, indexPath, loopIndexPath),
      loopIteration: (indexPath, loopIndexPath) =>
        loopRevealIteration(tree.errorLocations, indexPath, loopIndexPath),
    };
  }, [revealNonce, tree.errorLocations]);

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
    <LogErrorTraceContext.Provider value={errorCtx}>
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
    </LogErrorTraceContext.Provider>
  );
}
