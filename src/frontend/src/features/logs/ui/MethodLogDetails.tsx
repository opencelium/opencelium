import { Loading } from "@shared/ui/primitives/Loading/Loading";
import { Tabs } from "@shared/ui/primitives/Tabs";
import { Typography } from "@shared/ui/primitives/Typography";
import { useI18n } from "@shared/i18n/hooks/useI18n";
import { useGetMethodDetailsQuery } from "../api/logsApi";
import { ResizableJsonView } from "./ResizableJsonView";
import { useMethodDetailViewState } from "./methodDetailViewState";
import { CopyButton } from "./CopyButton";
import { ErrorDetail } from "./ErrorDetail";

// A tab label with a copy button (for the tab's raw content) next to the text.
function LabelWithCopy({ label, value }: { label: string; value: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      {label}
      <CopyButton value={value} />
    </span>
  );
}

type Props = {
  id: string;
  depth: number;
  // Stable per-row path so view state (open tab / heights) is scoped to this
  // method and not shared with sibling rows.
  path: string;
};

export function MethodLogDetails({ id, depth, path }: Props) {
  const { t } = useI18n("logs");
  const { tabs, setTab } = useMethodDetailViewState();
  const { data, isFetching, isError } = useGetMethodDetailsQuery(id);

  const requestTabKey = `${path}/request`;
  const responseTabKey = `${path}/response`;

  const wrapStyle: React.CSSProperties = {
    padding: `10px 12px 14px ${22 + depth * 22}px`,
    borderBottom: "1px solid var(--color-border-subtle)",
    background: "var(--color-background-surface)",
  };

  if (isFetching) {
    return (
      <div
        style={{
          ...wrapStyle,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 80,
        }}
      >
        <Loading size="md" inline />
      </div>
    );
  }
  if (isError || !data) {
    return (
      <div style={wrapStyle}>
        <Typography variant="caption" isDanger>
          {t("detailsError")}
        </Typography>
      </div>
    );
  }

  // A failed call shows its error in place of the request/response tabs.
  if (data.error?.message) {
    return (
      <ErrorDetail
        message={data.error.message}
        stackTrace={data.error.stack_trace}
        depth={depth}
      />
    );
  }

  // A failed method may have an incomplete segment (no request/response, or
  // missing header/payload) — fall back to empty strings, which the JSON views
  // render as an empty object.
  const request = data.segment?.request;
  const response = data.segment?.response;
  const requestHeader = request?.header ?? "";
  const requestPayload = request?.payload ?? "";
  const responseHeader = response?.header ?? "";
  const responsePayload = response?.payload ?? "";

  return (
    <div style={wrapStyle}>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 280 }}>
          <Tabs
            value={tabs[requestTabKey] ?? "body"}
            onChange={(key) => setTab(requestTabKey, key)}
            items={[
              {
                key: "header",
                label: <LabelWithCopy label={t("tabs.requestHeader")} value={requestHeader} />,
                content: (
                  <ResizableJsonView storageKey={`${path}/requestHeight`} value={requestHeader} />
                ),
              },
              {
                key: "body",
                label: <LabelWithCopy label={t("tabs.requestBody")} value={requestPayload} />,
                content: (
                  <ResizableJsonView storageKey={`${path}/requestHeight`} value={requestPayload} />
                ),
              },
            ]}
          />
        </div>
        <div style={{ flex: 1, minWidth: 280 }}>
          <Tabs
            value={tabs[responseTabKey] ?? "body"}
            onChange={(key) => setTab(responseTabKey, key)}
            items={[
              {
                key: "header",
                label: <LabelWithCopy label={t("tabs.responseHeader")} value={responseHeader} />,
                content: (
                  <ResizableJsonView storageKey={`${path}/responseHeight`} value={responseHeader} />
                ),
              },
              {
                key: "body",
                label: <LabelWithCopy label={t("tabs.responseBody")} value={responsePayload} />,
                content: (
                  <ResizableJsonView storageKey={`${path}/responseHeight`} value={responsePayload} />
                ),
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
