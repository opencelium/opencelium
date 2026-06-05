import { useState } from "react";
import { Loading } from "@shared/ui/primitives/Loading/Loading";
import { Typography } from "@shared/ui/primitives/Typography";
import type { LiveLogNode, LiveLogTree } from "../../model/liveLogTree";
import { LogRow, Meta, MethodBadge, OperatorLabel, StatusBadge, Url } from "../logRowUi";
import { LoopPager } from "../LoopPager";
import { ElementChildren } from "../LogElementRow";
import { MethodLogDetails } from "../MethodLogDetails";

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
        backgroundColor: status === "COMPLETE" ? "#52c41a" : "#ff4d4f",
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

  const isControlled = onToggle !== undefined;
  const expanded = isControlled ? !!expandedProp : internalExpanded;
  const toggle = isControlled ? onToggle : () => setInternalExpanded((v) => !v);

  const childExpansion: ChildExpansion = {
    isOpen: (index) => !!expandedChildren[index],
    toggle: (index) =>
      setExpandedChildren((prev) => ({ ...prev, [index]: !prev[index] })),
  };

  switch (node.type) {
    case "OPERATION": {
      const { request, response } = node.segment;
      // Details are fetched by the persisted element id — without one (no
      // socket line carried it) there is nothing to request.
      const expandable = node.id !== "";
      return (
        <>
          <LogRow
            depth={depth}
            expandable={expandable}
            expanded={expanded}
            onToggle={toggle}
            left={
              <>
                <MethodBadge method={request?.http_method ?? ""} />
                <Url>{request?.url ?? node.properties.name ?? ""}</Url>
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
                <LiveStatusIndicator status={node.status} />
              </Meta>
            }
          />
          <LiveErrorRow node={node} depth={depth + 1} />
          {expandable && expanded ? (
            <MethodLogDetails id={node.id} depth={depth + 1} path={node.key} />
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
          <LogRow
            depth={depth}
            expandable
            expanded={expanded}
            onToggle={toggle}
            left={<OperatorLabel label="LOOP" hint={node.properties.iterator} />}
            right={
              <Meta>
                {total > 0 ? (
                  <LoopPager index={position} size={total} onChange={setIterationPos} />
                ) : null}
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
              />
            ) : null
          ) : null}
        </>
      );
    }
    case "IF": {
      return (
        <>
          <LogRow
            depth={depth}
            expandable
            expanded={expanded}
            onToggle={toggle}
            left={<OperatorLabel label="IF" />}
            right={
              <Meta>
                {node.segment.result !== undefined ? (
                  <Typography variant="caption" isSubtle>
                    {node.segment.result}
                  </Typography>
                ) : null}
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
          <LogRow
            depth={depth}
            left={<OperatorLabel label={node.type} hint={node.properties.name} />}
            right={<LiveStatusIndicator status={node.status} />}
          />
          <LiveErrorRow node={node} depth={depth + 1} />
        </>
      );
  }
}
