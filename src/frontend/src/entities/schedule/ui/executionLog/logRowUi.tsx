import type { ReactNode } from "react";
import { Icon } from "@shared/ui/primitives/Icon";
import { LogJsonView } from "../LogJsonView";
import type { HttpMethod } from "../../model/executionLog.types";

const INDENT_STEP = 22;

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: "#1677ff",
  POST: "#52c41a",
  PUT: "#fa8c16",
  DELETE: "#ff4d4f",
  PATCH: "#722ed1",
};

const badgeBase: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  height: 20,
  padding: "0 8px",
  borderRadius: 4,
  fontSize: 12,
  fontWeight: 600,
  color: "#fff",
  lineHeight: 1,
  whiteSpace: "nowrap",
};

export function MethodBadge({ method }: { method: string }) {
  const color = METHOD_COLORS[method as HttpMethod] ?? "#8c8c8c";
  return <span style={{ ...badgeBase, backgroundColor: color }}>{method}</span>;
}

export function StatusBadge({ status }: { status: string }) {
  const code = Number.parseInt(status, 10);
  const isOk = Number.isFinite(code) && code >= 200 && code < 400;
  return (
    <span
      style={{ ...badgeBase, backgroundColor: isOk ? "#52c41a" : "#ff4d4f" }}
    >
      {status}
    </span>
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
