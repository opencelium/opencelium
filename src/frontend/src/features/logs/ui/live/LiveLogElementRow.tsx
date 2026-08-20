import { useEffect, useRef, useState } from "react";
import { Loading } from "@shared/ui/primitives/Loading/Loading";
import { Typography } from "@shared/ui/primitives/Typography";
import { appendLoopIndex, type LiveLogNode, type LiveLogTree } from "../../model/liveLogTree";
import { LogRow, Meta, MethodBadge, OperatorLabel, StatusBadge, TraceDot, Url } from "../logRowUi";
import { LoopPager } from "../LoopPager";
import { ElementChildren } from "../LogElementRow";
import { MethodLogDetails } from "../MethodLogDetails";
import { ErrorDetail } from "../ErrorDetail";
import { CopyButton } from "@shared/ui/actions/CopyButton";
import { serializeLogElement } from "../serializeLogElement";
import { useMethodViewMode } from "../methodViewMode";
import { methodDisplayText } from "../methodView";
import { useMethodLabelResolver } from "../methodLabels";
import { useLogErrorTrace } from "../logErrorTrace";

// How long the error-target row keeps its pulse highlight after the
// test-run reveal scrolls it into view (see logs.css's oc-log-row-error-pulse,
// which itself completes at 1.5s — this stays a bit longer so the class
// removal isn't racing the animation's own end).
const ERROR_HIGHLIGHT_MS = 1800;

// Matches ConnectorStatusDot's pulse duration (features/workflow/connector-status) —
// same ring animation, kept as a local copy since this dot lives in a different
// feature and CSS isn't part of either feature's public API.
const STATUS_PULSE_MS = 1000;

// Mirrors the REST tree's status colors: started rows show a spinner, finished
// rows a green/red dot. Flashes the same ring pulse ConnectorStatusDot uses
// when a connector goes down, both when this row's own status flips live and
// the first time a row mounts already finished — a LOOP/IF's children don't
// exist in the DOM until the operator is expanded, so a child that already
// finished while collapsed only gets to announce itself once the user opens
// the operator and it mounts for the first time.
export function LiveStatusIndicator({ status }: { status: LiveLogNode["status"] }) {
  const previousStatusRef = useRef<LiveLogNode["status"] | null>(null);
  const [isChanged, setIsChanged] = useState(false);
  useEffect(() => {
    if (previousStatusRef.current === status) return;
    previousStatusRef.current = status;
    if (status === "PENDING") return;
    setIsChanged(true);
    const timeout = setTimeout(() => setIsChanged(false), STATUS_PULSE_MS);
    return () => clearTimeout(timeout);
  }, [status]);

  if (status === "PENDING") return <Loading inline size="xs" />;
  const color = status === "COMPLETE" ? "var(--color-status-success-fg)" : "var(--color-status-error-fg)";
  const dotClassName = ["oc-log-status-dot", isChanged && "oc-log-status-dot--changed"]
    .filter(Boolean)
    .join(" ");
  return (
    <span
      className={dotClassName}
      style={{
        width: 8,
        height: 8,
        borderRadius: "50%",
        display: "inline-block",
        backgroundColor: color,
        color,
      }}
    />
  );
}

// Error routed to this node via `originOfErrorPath` — shown right under the
// row where the error happened. The stack trace (when present) is on hover.
// Plays the same reveal pulse as its header row (see `highlighted`) so the
// error text itself flashes too, not just the LOOP/IF/default row above it.
function LiveErrorRow({
  node,
  depth,
  highlighted = false,
}: {
  node: LiveLogNode;
  depth: number;
  highlighted?: boolean;
}) {
  const error = node.error;
  if (!error?.message) return null;
  return (
    <div
      className={highlighted ? "oc-log-row--error-target" : undefined}
      title={error.stackTrace ?? undefined}
      style={{
        padding: `6px 12px 8px ${24 + depth * 22}px`,
        borderBottom: "1px solid var(--color-border-subtle)",
        background: "var(--color-background-surface)",
      }}
    >
      <Typography variant="caption" isDanger>
        {error.code ? `[${error.code}] ${error.message}` : error.message}
      </Typography>
    </div>
  );
}

// Same parent-owned expansion contract as the REST tree: a loop keeps its
// children's open state keyed by position, so it survives iteration switches
// even though each iteration renders different rows. `open` is the idempotent
// set-true used by auto-reveal (a controlled child can't expand itself).
type ChildExpansion = {
  isOpen: (index: number) => boolean;
  toggle: (index: number) => void;
  open: (index: number) => void;
};

export function LiveChildren({
  tree,
  childKeys,
  depth,
  expansion,
}: {
  tree: LiveLogTree;
  childKeys: string[];
  depth: number;
  expansion?: ChildExpansion;
}) {
  return (
    <>
      {childKeys.map((key, index) => {
        const node = tree.nodes[key];
        return node ? (
          <LiveLogElementRow
            key={key}
            tree={tree}
            node={node}
            depth={depth}
            expanded={expansion ? expansion.isOpen(index) : undefined}
            onToggle={expansion ? () => expansion.toggle(index) : undefined}
            onReveal={expansion ? () => expansion.open(index) : undefined}
          />
        ) : null;
      })}
    </>
  );
}

export function LiveLogElementRow({
  tree,
  node,
  depth,
  expanded: expandedProp,
  onToggle,
  onReveal,
}: {
  tree: LiveLogTree;
  node: LiveLogNode;
  depth: number;
  // When `onToggle` is provided the row is controlled by its parent loop so
  // the open state persists across iteration changes.
  expanded?: boolean;
  onToggle?: () => void;
  // Idempotent "open me" from the parent (controlled rows), so auto-reveal can
  // open a row it doesn't directly own.
  onReveal?: () => void;
}) {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const [iterationPos, setIterationPos] = useState(0);
  // Per-position open state of this row's children, kept across iteration
  // changes (only consumed by the LOOP branch).
  const [expandedChildren, setExpandedChildren] = useState<Record<number, boolean>>({});

  const { mode } = useMethodViewMode();
  const resolveMethodLabel = useMethodLabelResolver();
  const {
    nonce,
    isOnTrace,
    isTarget,
    loopIteration,
    pauseNonce,
    isOnPauseTrace,
    isPauseTarget,
    pauseLoopIteration,
  } = useLogErrorTrace();
  const anchorRef = useRef<HTMLDivElement>(null);
  const [justRevealed, setJustRevealed] = useState(false);
  const [justPaused, setJustPaused] = useState(false);

  // Mark this row as part of the trace to an error (matched by structural
  // indexPath *and* this node's loop-iteration context), unless it already
  // shows a red FAIL dot — no double marker.
  const onTrace = isOnTrace(node.indexPath, node.loopIndex) && node.status !== "FAIL";
  const target = isTarget(node.indexPath, node.loopIndex);
  const pausedHere = isPauseTarget(node.indexPath, node.loopIndex);

  const isControlled = onToggle !== undefined;
  const expanded = isControlled ? !!expandedProp : internalExpanded;
  const toggle = isControlled ? onToggle : () => setInternalExpanded((v) => !v);

  const childExpansion: ChildExpansion = {
    isOpen: (index) => !!expandedChildren[index],
    toggle: (index) =>
      setExpandedChildren((prev) => ({ ...prev, [index]: !prev[index] })),
    open: (index) =>
      setExpandedChildren((prev) => (prev[index] ? prev : { ...prev, [index]: true })),
  };

  // After a failed run, follow the error trail: open this row, page a loop to the
  // failing iteration so its (REST-fetched) children continue the trail, and
  // scroll the failing element into view. Gated on `nonce` so it fires once per
  // reveal and never re-opens what the user has since collapsed.
  useEffect(() => {
    if (nonce === 0 || !isOnTrace(node.indexPath, node.loopIndex)) return;
    if (isControlled) onReveal?.();
    else setInternalExpanded(true);
    if (node.type === "LOOP") {
      const iter = loopIteration(node.indexPath, node.loopIndex);
      if (iter !== null) setIterationPos(iter);
    }
    if (!target) return;
    anchorRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    setJustRevealed(true);
    const timer = setTimeout(() => setJustRevealed(false), ERROR_HIGHLIGHT_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nonce]);

  // Debugger pause reveal: expand ancestors and page loops to the iteration
  // the run was actually paused in, exactly like the error trail above, but
  // deliberately does NOT expand the paused-on row ITSELF when it's an
  // OPERATION — that would fetch and show its request/response, and the
  // whole point is "only when the user opens it". Containers (LOOP/IF) have
  // no such hidden detail behind `expanded`, so those are still opened even
  // when they are themselves the paused-on element — otherwise the tree
  // couldn't reach further down to reveal anything at all.
  useEffect(() => {
    if (pauseNonce === 0 || !isOnPauseTrace(node.indexPath, node.loopIndex)) return;
    if (!(pausedHere && node.type === "OPERATION")) {
      if (isControlled) onReveal?.();
      else setInternalExpanded(true);
    }
    if (node.type === "LOOP") {
      const iter = pauseLoopIteration(node.indexPath, node.loopIndex);
      if (iter !== null) setIterationPos(iter);
    }
    if (!pausedHere) return;
    anchorRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    setJustPaused(true);
    const timer = setTimeout(() => setJustPaused(false), ERROR_HIGHLIGHT_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pauseNonce]);

  const scrollAnchor = target || pausedHere ? <div ref={anchorRef} aria-hidden /> : null;

  switch (node.type) {
    case "OPERATION": {
      const { request, response } = node.segment;
      const hasError = !!node.error?.message;
      // A failed call expands to its error (in place of request/response).
      // Otherwise details are fetched by the persisted element id — without one
      // (no socket line carried it) there is nothing to request.
      const expandable = node.id !== "" || hasError;
      const displayText = methodDisplayText(mode, {
        url: request?.url,
        label: node.properties.label ?? resolveMethodLabel(node.indexPath),
        name: node.properties.name,
      });
      return (
        <>
          {scrollAnchor}
          <LogRow
            depth={depth}
            expandable={expandable}
            expanded={expanded}
            onToggle={toggle}
            highlighted={justRevealed}
            pausedHighlighted={justPaused}
            left={
              <>
                {request?.http_method ? (
                  <MethodBadge method={request.http_method} />
                ) : null}
                <Url isError={hasError || target}>{displayText}</Url>
                {displayText ? (
                  <CopyButton value={displayText} className="oc-copy-on-hover" />
                ) : null}
              </>
            }
            right={
              <Meta>
                {response?.status && !hasError ? <StatusBadge status={response.status} /> : null}
                {response?.duration ? (
                  <Typography variant="caption" isSubtle>
                    {response.duration}
                  </Typography>
                ) : null}
                {onTrace ? <TraceDot /> : null}
                <LiveStatusIndicator status={node.status} />
              </Meta>
            }
          />
          {expandable && expanded ? (
            hasError ? (
              <ErrorDetail
                message={node.error!.message}
                code={node.error!.code}
                stackTrace={node.error!.stackTrace}
                depth={depth + 1}
              />
            ) : (
              <MethodLogDetails id={node.id} depth={depth + 1} path={node.key} />
            )
          ) : null}
        </>
      );
    }
    case "LOOP": {
      // Only the first iteration's subtree lives in memory; later iterations
      // only grew the counter. Paging to them loads the persisted children
      // over REST, exactly like the stored-logs viewer. The total is the
      // number of iterations observed so far — it grows as the logs arrive
      // rather than jumping to the declared size up front.
      const total = node.iterationCount;
      const position = Math.min(iterationPos, Math.max(total - 1, 0));
      const storedPosition =
        node.storedIteration !== null ? Number(node.storedIteration) : null;
      const showStored = storedPosition !== null && position === storedPosition;
      return (
        <>
          {scrollAnchor}
          <LogRow
            depth={depth}
            expandable
            expanded={expanded}
            onToggle={toggle}
            highlighted={justRevealed}
            pausedHighlighted={justPaused}
            left={
              <>
                <OperatorLabel label="LOOP" hint={node.properties.iterator} />
                <CopyButton value={serializeLogElement(node)} className="oc-copy-on-hover" />
              </>
            }
            right={
              <Meta>
                {total > 0 ? (
                  <LoopPager index={position} size={total} onChange={setIterationPos} />
                ) : null}
                {onTrace ? <TraceDot /> : null}
                <LiveStatusIndicator status={node.status} />
              </Meta>
            }
          />
          <LiveErrorRow node={node} depth={depth + 1} highlighted={justRevealed} />
          {expanded ? (
            showStored ? (
              <LiveChildren
                tree={tree}
                childKeys={node.childKeys}
                depth={depth + 1}
                expansion={childExpansion}
              />
            ) : node.id ? (
              <ElementChildren
                id={node.id}
                loopIndex={position}
                depth={depth + 1}
                expansion={childExpansion}
                path={node.key}
                loopIndexPath={appendLoopIndex(node.loopIndex, position)}
              />
            ) : null
          ) : null}
        </>
      );
    }
    case "IF": {
      return (
        <>
          {scrollAnchor}
          <LogRow
            depth={depth}
            expandable
            expanded={expanded}
            onToggle={toggle}
            highlighted={justRevealed}
            pausedHighlighted={justPaused}
            left={
              <>
                <OperatorLabel label="IF" />
                <CopyButton value={serializeLogElement(node)} className="oc-copy-on-hover" />
              </>
            }
            right={
              <Meta>
                {node.segment.result !== undefined ? (
                  <Typography variant="caption" isSubtle>
                    {node.segment.result}
                  </Typography>
                ) : null}
                {onTrace ? <TraceDot /> : null}
                <LiveStatusIndicator status={node.status} />
              </Meta>
            }
          />
          <LiveErrorRow node={node} depth={depth + 1} highlighted={justRevealed} />
          {expanded ? (
            <LiveChildren tree={tree} childKeys={node.childKeys} depth={depth + 1} />
          ) : null}
        </>
      );
    }
    default:
      return (
        <>
          {scrollAnchor}
          <LogRow
            depth={depth}
            highlighted={justRevealed}
            pausedHighlighted={justPaused}
            left={<OperatorLabel label={node.type} hint={node.properties.name} />}
            right={
              <Meta>
                {onTrace ? <TraceDot /> : null}
                <LiveStatusIndicator status={node.status} />
              </Meta>
            }
          />
          <LiveErrorRow node={node} depth={depth + 1} highlighted={justRevealed} />
        </>
      );
  }
}
