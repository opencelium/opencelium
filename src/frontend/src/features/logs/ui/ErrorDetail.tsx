import { Typography } from "@shared/ui/primitives/Typography";

const INDENT_STEP = 22;

// Shown in a method's expanded area in place of the request/response tabs when
// the call failed. Renders the error headline plus the full stack trace
// (scrollable). Accepts both the live socket shape (`stackTrace: string`) and
// the stored REST shape (`stack_trace: string[]`).
export function ErrorDetail({
  message,
  code,
  stackTrace,
  depth,
}: {
  message: string;
  code?: string | null;
  stackTrace?: string | string[] | null;
  depth: number;
}) {
  const stack = Array.isArray(stackTrace)
    ? stackTrace.join("\n")
    : stackTrace ?? "";

  return (
    <div
      style={{
        padding: `10px 12px 14px ${22 + depth * INDENT_STEP}px`,
        borderBottom: "1px solid var(--color-border-subtle)",
        background: "var(--color-status-error-bg)",
      }}
    >
      <Typography variant="label" isBold isDanger>
        {code ? `[${code}] ${message}` : message}
      </Typography>
      {stack ? (
        <pre
          style={{
            margin: "8px 0 0",
            padding: "8px 12px",
            fontSize: 12,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            maxHeight: 240,
            overflow: "auto",
            border: "1px solid var(--color-border-default)",
            borderRadius: 6,
            background: "var(--color-background-surface)",
            color: "var(--color-text-secondary)",
          }}
        >
          {stack}
        </pre>
      ) : null}
    </div>
  );
}
