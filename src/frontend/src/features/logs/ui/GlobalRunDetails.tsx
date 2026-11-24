import { Tag } from "antd";
import { Typography } from "@shared/ui/primitives/Typography";
import { useI18n } from "@shared/i18n/hooks/useI18n";
import type { GlobalRunLog } from "../model/types";

const compact = (value: unknown) => (value === undefined ? "" : JSON.stringify(value)).slice(0, 160);

/** Global-variable activity of one element (script calls, writes) or a whole run (snapshot, lock wait). */
export function GlobalRunDetails({ log }: { log: GlobalRunLog }) {
  const { t } = useI18n("logs");
  const calls = log.globalCalls ?? [];
  const summaries = log.globalCallSummary ?? [];
  const writes = log.globalWrites ?? [];
  const snapshot = log.globalSnapshot ?? [];
  if (!calls.length && !summaries.length && !writes.length && !snapshot.length && !log.lockWaitMs) return null;

  return (
    <div className="oc-log-globals" data-testid="logs-global-details">
      <Typography variant="label">{t("globals.title")}</Typography>
      {!!log.lockWaitMs && (
        <Typography variant="caption" isSubtle>{t("globals.lockWait", { ms: log.lockWaitMs })}</Typography>
      )}
      {summaries.map((summary) => (
        <Typography key={`${summary.index}-${summary.variable}`} variant="caption">
          {t("globals.callSummary", { variable: summary.variable, total: summary.totalCalls, failed: summary.failedCalls })}
          {summary.firstError ? ` · ${summary.firstError}` : ""}
        </Typography>
      ))}
      {calls.map((call, position) => (
        <div key={`${call.index}-${call.variable}-${position}`} className="oc-log-globals-row">
          <code>{`${call.variable}(${Object.entries(call.arguments).map(([name, value]) => `${name}=${compact(value)}`).join(", ")})`}</code>
          <span>→</span>
          {call.error
            ? <Typography variant="caption" isDanger>{`${call.error.code}: ${call.error.message}`}</Typography>
            : <code>{compact(call.result)}</code>}
          <Typography variant="caption" isSubtle>{t("globals.duration", { ms: call.durationMs, version: call.version })}</Typography>
        </div>
      ))}
      {writes.map((write) => (
        <div key={write.variable} className="oc-log-globals-row">
          <code>{write.variable}</code>
          <code>{`${compact(write.oldValue)} → ${compact(write.newValue)}`}</code>
          <Tag color={write.result === "SAVED" ? "success" : "error"}>{t(`globals.result.${write.result}`)}</Tag>
          {write.writeCount > 1 && <Typography variant="caption" isSubtle>{t("globals.writeCount", { count: write.writeCount })}</Typography>}
          {write.reason && <Typography variant="caption" isSubtle>{write.reason}</Typography>}
        </div>
      ))}
      {snapshot.length > 0 && (
        <details>
          <summary><Typography variant="caption" isSubtle>{t("globals.snapshot", { count: snapshot.length })}</Typography></summary>
          {snapshot.map((entry) => (
            <div key={entry.name} className="oc-log-globals-row">
              <code>{entry.name}</code>
              <Typography variant="caption" isSubtle>{`v${entry.version}`}</Typography>
              {entry.valueOmitted
                ? <Typography variant="caption" isSubtle>{t("globals.valueOmitted", { bytes: entry.valueBytes ?? 0 })}</Typography>
                : <code>{compact(entry.value)}</code>}
            </div>
          ))}
        </details>
      )}
    </div>
  );
}
