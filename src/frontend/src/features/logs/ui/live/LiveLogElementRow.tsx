import { useEffect, useRef, useState } from "react";
import { Loading } from "@shared/ui/primitives/Loading/Loading";
import { Typography } from "@shared/ui/primitives/Typography";
import { appendLoopIndex, type LiveLogNode, type LiveLogTree } from "../../model/liveLogTree";
import { LogRow, Meta, MethodBadge, OperatorLabel, StatusBadge, TraceDot, Url } from "../logRowUi";
import { LoopPager } from "../LoopPager";
import { ElementChildren } from "../LogElementRow";
import { MethodLogDetails } from "../MethodLogDetails";
import { ErrorDetail } from "../ErrorDetail";
import { CopyButton } from "../CopyButton";
import { serializeLogElement } from "../serializeLogElement";
import { useMethodViewMode } from "../methodViewMode";
import { methodDisplayText } from "../methodView";
import { useLiveReveal } from "./liveReveal";
import { useLogErrorTrace } from "../logErrorTrace";

// Mirrors the REST tree's status colors: started rows show a spinner, finished
// rows a green/red dot.
export function LiveStatusIndicator({ status }: { status: LiveLogNode["status"] }) {
  if (status === "PENDING") return <Loading inline size="xs" />;
  return (
    <span
      style={{
        width: 8,
        height: 8,
        borderRadius: "50%",
        display: "inline-block",
        backgroundColor: status === "COMPLETE" ? "var(--color-status-success-fg)" : "var(--color-status-error-fg)",
      }}
    />
  );
}


// Error routed to this node via `originOfErrorPath` — shown right under the
// row where the error happened. The stack trace (when present) is on hover.
function LiveErrorRow({ node, depth }: { node: LiveLogNode; depth: number }) {
  const error = node.error;
  if (!error?.message) return null;
  return (
    <div
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
// even though each iteration renders different rows.
type ChildExpansion = {
  isOpen: (index: number) => boolean;
  toggle: (index: number) => void;
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
}: {
  tree: LiveLogTree;
  node: LiveLogNode;
  depth: number;
  // When `onToggle` is provided the row is controlled by its parent loop so
  // the open state persists across iteration changes.
  expanded?: boolean;
  onToggle?: () => void;
}) {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const [iterationPos, setIterationPos] = useState(0);
  // Per-position open state of this row's children, kept across iteration
  // changes (only consumed by the LOOP branch).
  const [expandedChildren, setExpandedChildren] = useState<Record<number, boolean>>({});

  const { mode } = useMethodViewMode();
  const { nonce, revealKeys, targetKey } = useLiveReveal();
  const isOnTrace = useLogErrorTrace();
  const anchorRef = useRef<HTMLDivElement>(null);

  // Mark this row as part of the trace to an error (matched by structural
  // indexPath *and* this node's loop-iteration context), unless it already
  // shows a red FAIL dot — no double marker.
  const onTrace = isOnTrace(node.indexPath, node.loopIndex) && node.status !== "FAIL";

  const isControlled = onToggle !== undefined;
  const expanded = isControlled ? !!expandedProp : internalExpanded;
  const toggle = isControlled ? onToggle : () => setInternalExpanded((v) => !v);

  const childExpansion: ChildExpansion = {
    isOpen: (index) => !!expandedChildren[index],
    toggle: (index) =>
      setExpandedChildren((prev) => ({ ...prev, [index]: !prev[index] })),
  };

  // After a failed run, expand this row down the path to the error, page loops
  // to the stored iteration that holds it, open the failing method's detail, and
  // scroll it into view. Gated on `nonce` so it fires once per reveal and never
  // re-opens what the user has since collapsed.
  useEffect(() => {
    if (nonce === 0 || !revealKeys.has(node.key)) return;
    if (!isControlled) setInternalExpanded(true);
    if (node.type === "LOOP") {
      if (node.storedIteration !== null) setIterationPos(Number(node.storedIteration));
      // The failing element lives in the stored iteration's subtree; open the
      // child on the path (loop children are parent-controlled by index).
      const pathChildIndex = node.childKeys.findIndex((key) => revealKeys.has(key));
      if (pathChildIndex >= 0) {
        setExpandedChildren((prev) =>
          prev[pathChildIndex] ? prev : { ...prev, [pathChildIndex]: true },
        );
      }
    }
    if (node.key === targetKey) {
      anchorRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nonce]);

  const scrollAnchor =
    node.key === targetKey ? <div ref={anchorRef} aria-hidden /> : null;

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
        label: node.properties.label,
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
            left={
              <>
                {request?.http_method ? (
                  <MethodBadge method={request.http_method} />
                ) : null}
                <Url>{displayText}</Url>
                {displayText ? (
                  <CopyButton value={displayText} className="oc-copy-on-hover" />
                ) : null}
              </>
            }
            right={
              <Meta>
                {response?.status ? <StatusBadge status={response.status} /> : null}
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
          <LiveErrorRow node={node} depth={depth + 1} />
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
          <LiveErrorRow node={node} depth={depth + 1} />
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
            left={<OperatorLabel label={node.type} hint={node.properties.name} />}
            right={
              <Meta>
                {onTrace ? <TraceDot /> : null}
                <LiveStatusIndicator status={node.status} />
              </Meta>
            }
          />
          <LiveErrorRow node={node} depth={depth + 1} />
        </>
      );
  }
}
