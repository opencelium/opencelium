import { useState } from "react";
import { Loading } from "@shared/ui/primitives/Loading/Loading";
import { Typography } from "@shared/ui/primitives/Typography";
import type { LiveLogNode, LiveLogTree } from "../../model/liveLogTree";
import { LogRow, Meta, MethodBadge, OperatorLabel, StatusBadge, Url } from "../logRowUi";
import { LoopPager } from "../LoopPager";
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

export function LiveChildren({
  tree,
  childKeys,
  depth,
}: {
  tree: LiveLogTree;
  childKeys: string[];
  depth: number;
}) {
  return (
    <>
      {childKeys.map((key) => {
        const node = tree.nodes[key];
        return node ? (
          <LiveLogElementRow key={key} tree={tree} node={node} depth={depth} />
        ) : null;
      })}
    </>
  );
}

export function LiveLogElementRow({
  tree,
  node,
  depth,
}: {
  tree: LiveLogTree;
  node: LiveLogNode;
  depth: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const [iterationPos, setIterationPos] = useState(0);
  const toggle = () => setExpanded((v) => !v);

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
      // Iterations stream in one by one; the pager pages over what arrived.
      const iterationKeys = Object.keys(node.iterations).sort(
        (a, b) => Number(a) - Number(b),
      );
      const position = Math.min(iterationPos, Math.max(iterationKeys.length - 1, 0));
      const currentIteration = iterationKeys[position];
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
                {iterationKeys.length > 0 ? (
                  <LoopPager
                    index={position}
                    size={iterationKeys.length}
                    onChange={setIterationPos}
                  />
                ) : null}
                <LiveStatusIndicator status={node.status} />
              </Meta>
            }
          />
          <LiveErrorRow node={node} depth={depth + 1} />
          {expanded && currentIteration !== undefined ? (
            <LiveChildren
              tree={tree}
              childKeys={node.iterations[currentIteration] ?? []}
              depth={depth + 1}
            />
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
