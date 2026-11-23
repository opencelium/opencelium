import { useState, type ReactNode } from "react";
import { Tabs } from "@shared/ui/primitives/Tabs";
import { useI18n } from "@shared/i18n/hooks/useI18n";
import { CopyButton } from "@shared/ui/actions/CopyButton";
import { IconButton } from "@shared/ui/primitives/IconButton";
import { Tooltip } from "@shared/ui/primitives/Tooltip";
import { Typography } from "@shared/ui/primitives/Typography";
import { MaximizedBodyDialog } from "./MaximizedBodyDialog";
import "./logs.css";
import { ResizableJsonView } from "./ResizableJsonView";
import { useMethodDetailViewState } from "./methodDetailViewState";

// A pane caption with a copy button (for the pane's raw content) and an optional maximize
// button. Without content the buttons keep their space hidden, so both captions line up.
function PaneCaption({ label, value, onMaximize, maximizeTestId }: {
  label: string;
  value: string | null;
  onMaximize?: () => void;
  maximizeTestId?: string;
}) {
  const { t } = useI18n("common");
  const hidden = value === null ? { visibility: "hidden" as const } : undefined;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, minHeight: 28 }}>
      <Typography variant="label" isSubtle>{label}</Typography>
      <span style={hidden}>
        <CopyButton value={value ?? ""} />
      </span>
      {onMaximize && (
        <span style={hidden}>
          <Tooltip content={t("dialog.maximize")}>
            <IconButton type="text" size="xs" iconProps={{ name: "maximize" }} onClick={onMaximize}
              testId={maximizeTestId} />
          </Tooltip>
        </span>
      )}
    </div>
  );
}

type Side = "request" | "response";
type TabKey = "body" | "headers";

type Props = {
  // Scopes the persisted open tab / view heights to one method.
  path: string;
  requestHeader: string;
  requestPayload: string;
  // A placeholder stands in for the response pane of both tabs before (or without) a response.
  response:
    | { kind: "payload"; header: string; payload: string }
    | { kind: "placeholder"; content: ReactNode };
  // Both panes stretch to the parent's height instead of using resizable views.
  isFullHeight?: boolean;
  // Replace the default JSON views of the request (the raw text is still what gets copied).
  requestHeaderContent?: ReactNode;
  requestBodyContent?: ReactNode;
  // Adds a maximize button to both body panes that opens the body full screen.
  isBodyMaximizable?: boolean;
};

export function RequestResponseTabs({
  path,
  requestHeader,
  requestPayload,
  response,
  isFullHeight = false,
  requestHeaderContent,
  requestBodyContent,
  isBodyMaximizable = false,
}: Props) {
  const { t } = useI18n("logs");
  const { tabs, setTab } = useMethodDetailViewState();
  const [maximized, setMaximized] = useState<Side | null>(null);
  const tabStateKey = `${path}/tab`;
  const responseValues = response.kind === "payload"
    ? { header: response.header, payload: response.payload }
    : null;

  const columnStyle: React.CSSProperties = isFullHeight
    ? { flex: 1, minWidth: 280, display: "flex", flexDirection: "column", minHeight: 0 }
    : { flex: 1, minWidth: 280 };
  const fill: React.CSSProperties = isFullHeight ? { flex: 1, minHeight: 0 } : {};
  const framed = (content: ReactNode) => (
    <div style={{ height: isFullHeight ? "100%" : 180, boxSizing: "border-box", overflow: "auto",
      border: "1px solid var(--color-border-default)", borderRadius: 6 }}>
      {content}
    </div>
  );
  // Both panes of a tab share one height key, so resizing either keeps the two side by side level.
  const jsonView = (tab: TabKey, value: string) => (
    <ResizableJsonView storageKey={`${path}/${tab}Height`} value={value} isFullHeight={isFullHeight} />
  );

  const pane = (caption: ReactNode, content: ReactNode) => (
    <div style={columnStyle}>
      {caption}
      <div style={fill}>{content}</div>
    </div>
  );

  const split = (tab: TabKey) => {
    const isBody = tab === "body";
    const requestValue = isBody ? requestPayload : requestHeader;
    const requestCustom = isBody ? requestBodyContent : requestHeaderContent;
    const responseValue = responseValues ? (isBody ? responseValues.payload : responseValues.header) : null;
    const maximize = (side: Side) => (isBody && isBodyMaximizable ? () => setMaximized(side) : undefined);
    return (
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", ...(isFullHeight ? { height: "100%", minHeight: 0 } : {}) }}>
        {pane(
          <PaneCaption label={t("tabs.request")} value={requestValue} onMaximize={maximize("request")}
            maximizeTestId="logs-maximize-request-body" />,
          requestCustom ? framed(requestCustom) : jsonView(tab, requestValue),
        )}
        {pane(
          <PaneCaption label={t("tabs.response")} value={responseValue} onMaximize={maximize("response")}
            maximizeTestId="logs-maximize-response-body" />,
          response.kind === "payload"
            ? jsonView(tab, isBody ? response.payload : response.header)
            : response.content,
        )}
      </div>
    );
  };

  return (
    <div className="oc-request-response-tabs" style={isFullHeight ? { height: "100%", minHeight: 0 } : undefined}>
      <Tabs
        value={tabs[tabStateKey] ?? "body"}
        onChange={(key) => setTab(tabStateKey, key)}
        isFullHeight={isFullHeight}
        items={[
          { key: "body", label: t("tabs.sentReceived"), content: split("body") },
          { key: "headers", label: t("tabs.headers"), content: split("headers") },
        ]}
      />
      {maximized === "request" && (
        <MaximizedBodyDialog title={t("tabs.requestBody")} onClose={() => setMaximized(null)}
          content={requestBodyContent ?? <ResizableJsonView storageKey={`${path}/requestMaximized`}
            value={requestPayload} isFullHeight />} />
      )}
      {maximized === "response" && responseValues && (
        <MaximizedBodyDialog title={t("tabs.responseBody")} onClose={() => setMaximized(null)}
          content={<ResizableJsonView storageKey={`${path}/responseMaximized`} value={responseValues.payload}
            isFullHeight />} />
      )}
    </div>
  );
}
