import { useEffect, useMemo, useState } from "react";
import { Typography } from "@shared/ui/primitives/Typography";
import { useI18n } from "@shared/i18n/hooks/useI18n";
import {
  findErrorRevealPath,
  makeErrorTraceMatcher,
  type LiveLogNode,
  type LiveLogTree,
} from "../../model/liveLogTree";
import { LogRow, Meta, TraceDot } from "../logRowUi";
import { MethodDetailViewStateProvider } from "../methodDetailViewState";
import { LiveChildren, LiveStatusIndicator } from "./LiveLogElementRow";
import { LiveRevealContext, useLiveReveal, type LiveRevealState } from "./liveReveal";
import { LogErrorTraceContext, useLogErrorTrace } from "../logErrorTrace";

function LiveConnectorRow({ tree, node }: { tree: LiveLogTree; node: LiveLogNode }) {
  const [expanded, setExpanded] = useState(true);
  const { nonce, revealKeys } = useLiveReveal();
  const isOnTrace = useLogErrorTrace();
  const onTrace = isOnTrace(node.indexPath, node.loopIndex) && node.status !== "FAIL";

  // Re-open a connector the user had collapsed when the error lives inside it.
  useEffect(() => {
    if (nonce > 0 && revealKeys.has(node.key)) setExpanded(true);
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
          <Typography variant="label" isBold isUppercase>
            {node.connectorName !== "DEFAULT" ? node.connectorName : "WORKFLOW"}
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
  // Bumped by the test-run provider when a run fails; triggers the tree to
  // expand down to (and scroll to) the failing element.
  revealNonce?: number;
}) {
  const { t } = useI18n("logs");

  const errorTrace = useMemo(
    () => makeErrorTraceMatcher(tree.errorLocations),
    [tree.errorLocations],
  );

  const reveal = useMemo<LiveRevealState>(() => {
    if (revealNonce === 0) {
      return { nonce: 0, revealKeys: new Set<string>(), targetKey: null };
    }
    const found = findErrorRevealPath(tree);
    return {
      nonce: revealNonce,
      revealKeys: new Set(found?.pathKeys ?? []),
      targetKey: found?.targetKey ?? null,
    };
  }, [revealNonce, tree]);

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
    <LiveRevealContext.Provider value={reveal}>
      <LogErrorTraceContext.Provider value={errorTrace}>
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
    </LiveRevealContext.Provider>
  );
}
