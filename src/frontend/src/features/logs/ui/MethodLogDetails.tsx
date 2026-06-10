import { Loading } from "@shared/ui/primitives/Loading/Loading";
import { Tabs } from "@shared/ui/primitives/Tabs";
import { Typography } from "@shared/ui/primitives/Typography";
import { useI18n } from "@shared/i18n/hooks/useI18n";
import { useGetMethodDetailsQuery } from "../api/logsApi";
import { ResizableJsonView } from "./ResizableJsonView";
import { useMethodDetailViewState } from "./methodDetailViewState";
import { CopyButton } from "./CopyButton";

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

  const { request, response } = data.segment;

  return (
    <div style={wrapStyle}>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 280 }}>
          <Tabs
            value={tabs[requestTabKey] ?? "header"}
            onChange={(key) => setTab(requestTabKey, key)}
            items={[
              {
                key: "header",
                label: <LabelWithCopy label={t("tabs.requestHeader")} value={request.header} />,
                content: (
                  <ResizableJsonView storageKey={`${path}/requestHeight`} value={request.header} />
                ),
              },
              {
                key: "body",
                label: <LabelWithCopy label={t("tabs.requestBody")} value={request.payload} />,
                content: (
                  <ResizableJsonView storageKey={`${path}/requestHeight`} value={request.payload} />
                ),
              },
            ]}
          />
        </div>
        <div style={{ flex: 1, minWidth: 280 }}>
          <Tabs
            value={tabs[responseTabKey] ?? "header"}
            onChange={(key) => setTab(responseTabKey, key)}
            items={[
              {
                key: "header",
                label: <LabelWithCopy label={t("tabs.responseHeader")} value={response.header} />,
                content: (
                  <ResizableJsonView storageKey={`${path}/responseHeight`} value={response.header} />
                ),
              },
              {
                key: "body",
                label: <LabelWithCopy label={t("tabs.responseBody")} value={response.payload} />,
                content: (
                  <ResizableJsonView storageKey={`${path}/responseHeight`} value={response.payload} />
                ),
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
