import { useState } from "react";
import { Loading } from "@shared/ui/primitives/Loading/Loading";
import { Typography } from "@shared/ui/primitives/Typography";
import { useI18n } from "@shared/i18n/hooks/useI18n";
import { useGetElementChildrenQuery } from "../api/logsApi";
import { appendLoopIndex } from "../model/liveLogTree";
import type { FlowchartChildLog } from "../model/types";
import { LogRow, Meta, MethodBadge, OperatorLabel, StatusBadge, TraceDot, Url } from "./logRowUi";
import { MethodLogDetails } from "./MethodLogDetails";
import { LoopPager } from "./LoopPager";
import { CopyButton } from "./CopyButton";
import { serializeLogElement } from "./serializeLogElement";
import { useMethodViewMode } from "./methodViewMode";
import { methodDisplayText } from "./methodView";
import { useLogErrorTrace } from "./logErrorTrace";

const INDENT_STEP = 22;

// Lets a parent (e.g. a loop) own its children's expand/collapse state keyed by
// position, so the state survives switching iterations even though each
// iteration's rows remount with new ids.
type ChildExpansion = {
  isOpen: (index: number) => boolean;
  toggle: (index: number) => void;
};

// Renders the children of an element (connector or operator) for one loop iteration.
export function ElementChildren({
  id,
  loopIndex,
  depth,
  expansion,
  path,
  loopIndexPath = "",
}: {
  id: string;
  loopIndex?: number;
  depth: number;
  expansion?: ChildExpansion;
  // Structural path of the parent, independent of the loop iteration, used to
  // scope per-row view state (open tab / resized heights).
  path: string;
  // Cumulative loop-iteration context these children are rendered in (enclosing
  // loops' iteration indices), used to match the error trace per iteration.
  loopIndexPath?: string;
}) {
  const { t } = useI18n("logs");
  const { data, isFetching, isError } = useGetElementChildrenQuery({
    id,
    loopIndex,
  });

  const pad: React.CSSProperties = {
    padding: `8px 0 8px ${24 + depth * INDENT_STEP}px`,
  };

  if (isFetching) {
    return (
      <div style={pad}>
        <Loading size="sm" inline />
      </div>
    );
  }
  if (isError) {
    return (
      <div style={pad}>
        <Typography variant="caption" isDanger>
          {t("childrenError")}
        </Typography>
      </div>
    );
  }
  if (!data || data.length === 0) {
    return (
      <div style={pad}>
        <Typography variant="caption" isSubtle>
          {t("empty")}
        </Typography>
      </div>
    );
  }
  return (
    <>
      {data.map((child, index) => (
        <LogElementRow
          key={child.id}
          log={child}
          depth={depth}
          path={`${path}.${index}`}
          loopIndexPath={loopIndexPath}
          expanded={expansion ? expansion.isOpen(index) : undefined}
          onToggle={expansion ? () => expansion.toggle(index) : undefined}
        />
      ))}
    </>
  );
}

export function LogElementRow({
  log,
  depth,
  path,
  loopIndexPath = "",
  expanded: expandedProp,
  onToggle,
}: {
  log: FlowchartChildLog;
  depth: number;
  // Structural path of this row, stable across loop iterations.
  path: string;
  // Cumulative loop-iteration context this row is rendered in, used to match the
  // error trace per iteration (so markers track the failing iteration only).
  loopIndexPath?: string;
  // When `onToggle` is provided the row is controlled by its parent (used so a
  // loop can persist its children's open state across iterations).
  expanded?: boolean;
  onToggle?: () => void;
}) {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const [loopIndex, setLoopIndex] = useState(0);
  // Per-position open state for this row's children, kept across iteration
  // changes (only consumed by the LOOP branch).
  const [expandedChildren, setExpandedChildren] = useState<
    Record<number, boolean>
  >({});

  const { mode } = useMethodViewMode();
  const isOnTrace = useLogErrorTrace();
  // REST rows carry no status dot, so the trace marker is shown on every row on
  // the path to the error (the failing element and its ancestors), matched by
  // indexPath *and* this row's loop-iteration context.
  const onTrace = isOnTrace(log.indexPath, loopIndexPath);

  const isControlled = onToggle !== undefined;
  const expanded = isControlled ? !!expandedProp : internalExpanded;
  const toggle = isControlled ? onToggle : () => setInternalExpanded((v) => !v);

  const childExpansion = {
    isOpen: (index: number) => !!expandedChildren[index],
    toggle: (index: number) =>
      setExpandedChildren((prev) => ({ ...prev, [index]: !prev[index] })),
  };

  switch (log.type) {
    case "OPERATION": {
      // Backend rows can arrive with an incomplete segment (e.g. a method that
      // failed before its request was built), so guard every field.
      const request = log.segment?.request;
      const response = log.segment?.response;
      const displayText = methodDisplayText(mode, {
        url: request?.url,
        label: log.properties?.label,
        name: log.properties?.name,
      });
      return (
        <>
          <LogRow
            depth={depth}
            expandable
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
              </Meta>
            }
          />
          {expanded ? (
            <MethodLogDetails id={log.id} depth={depth + 1} path={path} />
          ) : null}
        </>
      );
    }
    case "LOOP": {
      return (
        <>
          <LogRow
            depth={depth}
            expandable
            expanded={expanded}
            onToggle={toggle}
            left={
              <>
                <OperatorLabel label="LOOP" hint={log.properties.iterator} />
                <CopyButton value={serializeLogElement(log)} className="oc-copy-on-hover" />
              </>
            }
            right={
              <Meta>
                <LoopPager
                  index={loopIndex}
                  size={log.properties.size}
                  onChange={setLoopIndex}
                />
                {onTrace ? <TraceDot /> : null}
              </Meta>
            }
          />
          {expanded ? (
            <ElementChildren
              id={log.id}
              loopIndex={loopIndex}
              depth={depth + 1}
              expansion={childExpansion}
              path={path}
              loopIndexPath={appendLoopIndex(loopIndexPath, loopIndex)}
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
            left={
              <>
                <OperatorLabel label="IF" />
                <CopyButton value={serializeLogElement(log)} className="oc-copy-on-hover" />
              </>
            }
            right={
              <Meta>
                <Typography variant="caption" isSubtle>
                  {log.segment?.result}
                </Typography>
                {onTrace ? <TraceDot /> : null}
              </Meta>
            }
          />
          {expanded ? (
            <ElementChildren
              id={log.id}
              loopIndex={0}
              depth={depth + 1}
              path={path}
              loopIndexPath={loopIndexPath}
            />
          ) : null}
        </>
      );
    }
    default: {
      const _exhaustive: never = log;
      return _exhaustive;
    }
  }
}
