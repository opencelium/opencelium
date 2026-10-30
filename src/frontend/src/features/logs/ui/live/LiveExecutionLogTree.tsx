import { useEffect, useMemo, useState } from "react";
import { Typography } from "@shared/ui/primitives/Typography";
import { useI18n } from "@shared/i18n/hooks/useI18n";
import {
  isLocationTarget,
  loopRevealIteration,
  makeTraceMatcher,
  type LiveLogNode,
  type LiveLogTree,
  type RevealLocation,
} from "../../model/liveLogTree";
import { LogRow, Meta, TraceDot } from "../logRowUi";
import { MethodDetailViewStateProvider } from "../methodDetailViewState";
import { LiveChildren, LiveStatusIndicator } from "./LiveLogElementRow";
import {
  LogErrorTraceContext,
  useLogErrorTrace,
  type LogErrorTrace,
} from "../logErrorTrace";
import { LogTargetSlotsProvider, type LogTargetSlots } from "../logTargetSlots";
import { useLogTargetSlots } from "../useLogTargetSlots";

function LiveConnectorRow({ tree, node, isFirst }: { tree: LiveLogTree; node: LiveLogNode; isFirst: boolean }) {
  const [expanded, setExpanded] = useState(true);
  const { headerStatus } = useLogTargetSlots(node.indexPath, node.loopIndex);
  const { t } = useI18n("logs");
  const { nonce, isOnTrace, pauseNonce } = useLogErrorTrace();
  const onTrace = isOnTrace(node.indexPath, node.loopIndex) && node.status !== "FAIL";

  // Re-open a connector the user had collapsed when a run fails (the error
  // trail starts at the connector root) or when the debugger pauses (the
  // paused-on node's ancestors, all the way up, need to be reachable too).
  useEffect(() => {
    if (nonce > 0) setExpanded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nonce]);
  useEffect(() => {
    if (pauseNonce > 0) setExpanded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pauseNonce]);

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
            {isFirst ? headerStatus : null}
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

const NO_SLOTS: LogTargetSlots = {};

// Same look as ExecutionLogTree, but rendered entirely from the live socket
// stream (LiveLogTree) — used by the workflow test-run panel.
export function LiveExecutionLogTree({
  tree,
  fill = false,
  revealNonce = 0,
  pauseTarget = null,
  pauseRevealNonce = 0,
  slots = NO_SLOTS,
}: {
  tree: LiveLogTree;
  fill?: boolean;
  // Bumped by the test-run provider when a run fails; triggers the tree to page
  // loops to the failing iterations and expand down to the failing element.
  revealNonce?: number;
  // Where the debugger is currently paused — external to `tree` (it comes
  // from TestRunContext.currentStep, not the log stream itself), so it's
  // passed in rather than read off the tree like errorLocations.
  pauseTarget?: RevealLocation | null;
  // Bumped once the pause's structure prefetch (see prefetchPauseTracePath)
  // has warmed the cache; triggers the tree to page loops to the paused
  // iteration and expand down to (but not open) the paused-on element.
  pauseRevealNonce?: number;
  slots?: LogTargetSlots;
}) {
  const { t } = useI18n("logs");

  const pauseLocations = useMemo<RevealLocation[]>(
    () => (pauseTarget ? [pauseTarget] : []),
    [pauseTarget],
  );

  const errorCtx = useMemo<LogErrorTrace>(() => {
    const matcher = makeTraceMatcher(tree.errorLocations);
    const pauseMatcher = makeTraceMatcher(pauseLocations);
    return {
      nonce: revealNonce,
      isOnTrace: matcher,
      isTarget: (indexPath, loopIndexPath) =>
        isLocationTarget(tree.errorLocations, indexPath, loopIndexPath),
      loopIteration: (indexPath, loopIndexPath) =>
        loopRevealIteration(tree.errorLocations, indexPath, loopIndexPath),
      pauseNonce: pauseRevealNonce,
      isOnPauseTrace: pauseMatcher,
      isPauseTarget: (indexPath, loopIndexPath) =>
        isLocationTarget(pauseLocations, indexPath, loopIndexPath),
      pauseLoopIteration: (indexPath, loopIndexPath) =>
        loopRevealIteration(pauseLocations, indexPath, loopIndexPath),
    };
  }, [revealNonce, tree.errorLocations, pauseRevealNonce, pauseLocations]);

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
      <LogTargetSlotsProvider value={slots}>
      <MethodDetailViewStateProvider>
        <div
          style={{
            border: "1px solid var(--color-border-default)",
            borderRadius: 6,
            overflow: "auto",
            ...(fill ? { flex: 1, minHeight: 0 } : { maxHeight: "60vh" }),
          }}
        >
          {tree.rootKeys.map((key, position) => {
            const node = tree.nodes[key];
            return node ? (
              <LiveConnectorRow key={key} tree={tree} node={node} isFirst={position === 0} />
            ) : null;
          })}
        </div>
      </MethodDetailViewStateProvider>
      </LogTargetSlotsProvider>
    </LogErrorTraceContext.Provider>
  );
}
