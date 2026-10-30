import { useState } from "react";
import { useI18n } from "@shared/i18n/hooks/useI18n";
import { CopyButton } from "@shared/ui/actions/CopyButton";
import { Button } from "@shared/ui/primitives/Button";
import { Typography } from "@shared/ui/primitives/Typography";
import { splitErrorText } from "./errorText";

const INDENT_STEP = 22;
const SHOWN_TRACE_LINES = 3;

// Shown in a method's expanded area in place of the request/response tabs when
// the call failed: the error headline, the first stack lines and the rest on
// demand. Accepts both the live socket shape (`stackTrace: string`) and the
// stored REST shape (`stack_trace: string[]`).
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
  const { t } = useI18n("logs");
  const [isTraceOpen, setIsTraceOpen] = useState(false);
  const { headline, lines, fullText } = splitErrorText(code ? `[${code}] ${message}` : message, stackTrace);
  const hidden = lines.length - SHOWN_TRACE_LINES;
  const shown = isTraceOpen || hidden <= 0 ? lines : lines.slice(0, SHOWN_TRACE_LINES);

  return (
    <div
      className="oc-log-error-detail"
      style={{
        padding: `10px 12px 12px ${22 + depth * INDENT_STEP}px`,
        borderBottom: "1px solid var(--color-border-subtle)",
        background: "var(--color-status-error-bg)",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0, wordBreak: "break-word" }}>
          <Typography variant="label" isBold isDanger>
            {headline}
          </Typography>
        </div>
        <CopyButton value={fullText} testId="log-error-copy" />
      </div>
      {shown.length > 0 ? (
        <div
          style={{
            marginTop: 6,
            fontSize: 12,
            lineHeight: 1.6,
            color: "var(--color-status-error-fg)",
            opacity: 0.85,
            wordBreak: "break-word",
            maxHeight: isTraceOpen ? 240 : undefined,
            overflow: isTraceOpen ? "auto" : undefined,
          }}
        >
          {shown.map((line, index) => (
            <div key={index}>{line}</div>
          ))}
        </div>
      ) : null}
      {hidden > 0 ? (
        <Button type="link" onClick={() => setIsTraceOpen((open) => !open)} testId="log-error-toggle-trace" className="oc-log-error-trace-toggle">
          {isTraceOpen ? t("errorTrace.hideFull") : t("errorTrace.showFull", { count: hidden })}
        </Button>
      ) : null}
    </div>
  );
}
