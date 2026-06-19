import type { ReactNode } from "react";
import { Icon } from "@shared/ui/primitives/Icon";
import { Typography } from "@shared/ui/primitives/Typography";
import { LogJsonView } from "@shared/ui/json-view/LogJsonView";
import type { HttpMethod } from "../model/types";
import "./logs.css";

const INDENT_STEP = 22;

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: "var(--color-status-info-fg)",
  POST: "var(--color-status-success-fg)",
  PUT: "var(--color-status-warning-fg)",
  DELETE: "var(--color-status-error-fg)",
  PATCH: "var(--color-action-secondary)",
};

const badgeBase: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  height: 20,
  padding: "0 8px",
  borderRadius: 4,
  fontSize: 12,
  fontWeight: 600,
  color: "var(--color-text-on-action)",
  lineHeight: 1,
  whiteSpace: "nowrap",
};

export function MethodBadge({ method }: { method: string }) {
  const color = METHOD_COLORS[method as HttpMethod] ?? "var(--color-text-secondary)";
  return <span style={{ ...badgeBase, backgroundColor: color }}>{method}</span>;
}

export function StatusBadge({ status }: { status: string }) {
  const code = Number.parseInt(status, 10);
  const isOk = Number.isFinite(code) && code >= 200 && code < 400;
  return (
    <span
      style={{ ...badgeBase, backgroundColor: isOk ? "var(--color-status-success-fg)" : "var(--color-status-error-fg)" }}
    >
      {status}
    </span>
  );
}

export function Url({ children, isError = false }: { children: string; isError?: boolean }) {
  return (
    <span
      style={{
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        fontSize: 13,
        // Allow the flex item to shrink below its content width so the URL
        // ellipsizes instead of overflowing and pushing the copy icon off-row.
        minWidth: 0,
        flexShrink: 1,
        ...(isError ? { color: "var(--color-status-error-fg)" } : {}),
      }}
      title={children}
    >
      {children}
    </span>
  );
}

export function OperatorLabel({ label, hint }: { label: string; hint?: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "baseline", gap: 6 }}>
      <Typography variant="label" isBold>
        {label}
      </Typography>
      {hint ? (
        <Typography variant="caption" isSubtle>
          {hint}
        </Typography>
      ) : null}
    </span>
  );
}

export function Meta({ children }: { children: ReactNode }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      {children}
    </span>
  );
}

// Red marker drawn on every row on a path to an error (the failing element and
// each of its ancestors), so the trace from the top down to the error reads as
// a column of red dots. Shared by the live and REST trees.
export function TraceDot() {
  return (
    <span
      style={{
        width: 8,
        height: 8,
        borderRadius: "50%",
        display: "inline-block",
        backgroundColor: "var(--color-status-error-fg)",
      }}
    />
  );
}

export function ExpandChevron({ expanded }: { expanded: boolean }) {
  return (
    <Icon
      name={expanded ? "chevron-down" : "chevron-right"}
      size={14}
      isSubtle
    />
  );
}

type LogRowProps = {
  depth?: number;
  expandable?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
  left: ReactNode;
  right?: ReactNode;
};

export function LogRow({
  depth = 0,
  expandable = false,
  expanded = false,
  onToggle,
  left,
  right,
}: LogRowProps) {
  return (
    <div
      className="oc-log-row"
      onClick={expandable ? onToggle : undefined}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        minHeight: 36,
        padding: "6px 10px",
        paddingLeft: 10 + depth * INDENT_STEP,
        borderBottom: "1px solid var(--color-border-subtle)",
        cursor: expandable ? "pointer" : "default",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--color-background-page)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      <span style={{ width: 14, display: "inline-flex", flexShrink: 0 }}>
        {expandable ? <ExpandChevron expanded={expanded} /> : null}
      </span>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          minWidth: 0,
          flex: 1,
        }}
      >
        {left}
      </div>
      {right ? <div style={{ flexShrink: 0 }}>{right}</div> : null}
    </div>
  );
}

function tryParseObject(value: string): object | null {
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? (parsed as object) : null;
  } catch {
    return null;
  }
}

// Backend payloads/headers arrive as JSON strings; render parsed JSON when
// possible and fall back to the raw text otherwise. In `bare` mode the parent
// owns the border/scroll/height (used by the resizable method-detail views).
export function JsonStringView({
  value,
  bare = false,
}: {
  value: string;
  bare?: boolean;
}) {
  if (!value || !value.trim()) {
    return <LogJsonView data={{}} bare={bare} />;
  }
  const parsed = tryParseObject(value);
  if (parsed) {
    return <LogJsonView data={parsed} bare={bare} />;
  }
  return (
    <pre
      style={{
        margin: 0,
        padding: "8px 12px",
        fontSize: 13,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        ...(bare
          ? {}
          : {
              border: "1px solid var(--color-border-default)",
              borderRadius: 6,
              maxHeight: 220,
              overflow: "auto",
            }),
      }}
    >
      {value}
    </pre>
  );
}
