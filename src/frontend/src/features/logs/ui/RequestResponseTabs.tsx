import { useState, type ReactNode } from "react";
import { Tabs } from "@shared/ui/primitives/Tabs";
import { useI18n } from "@shared/i18n/hooks/useI18n";
import { CopyButton } from "@shared/ui/actions/CopyButton";
import { IconButton } from "@shared/ui/primitives/IconButton";
import { Tooltip } from "@shared/ui/primitives/Tooltip";
import { MaximizedBodyDialog } from "./MaximizedBodyDialog";
import "./logs.css";
import { ResizableJsonView } from "./ResizableJsonView";
import { useMethodDetailViewState } from "./methodDetailViewState";

// A tab label with a copy button (for the tab's raw content) next to the text, plus an optional
// maximize button. Without content the buttons keep their space hidden, so both tab rows line up.
function LabelWithCopy({ label, value, onMaximize, maximizeTestId }: {
  label: string;
  value: string | null;
  onMaximize?: () => void;
  maximizeTestId?: string;
}) {
  const { t } = useI18n("common");
  const hidden = value === null ? { visibility: "hidden" as const } : undefined;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      {label}
      <span style={hidden}>
        <CopyButton value={value ?? ""} />
      </span>
      {onMaximize && (
        <span style={hidden} onClick={(event) => event.stopPropagation()}>
          <Tooltip content={t("dialog.maximize")}>
            <IconButton type="text" size="xs" iconProps={{ name: "maximize" }} onClick={onMaximize}
              testId={maximizeTestId} />
          </Tooltip>
        </span>
      )}
    </span>
  );
}

type MaximizedBody = "request" | "response";

type Props = {
  // Scopes the persisted open tab / view heights to one method.
  path: string;
  requestHeader: string;
  requestPayload: string;
  // A placeholder stands in for both response tabs before (or without) a response.
  response:
    | { kind: "payload"; header: string; payload: string }
    | { kind: "placeholder"; content: ReactNode };
  // Both panes stretch to the parent's height instead of using resizable views.
  isFullHeight?: boolean;
  // Replace the default JSON views of the request (the raw text is still what gets copied).
  requestHeaderContent?: ReactNode;
  requestBodyContent?: ReactNode;
  // Adds a maximize button to both body tabs that opens the body full screen.
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
  const [maximized, setMaximized] = useState<MaximizedBody | null>(null);
  const maximize = (body: MaximizedBody) => isBodyMaximizable ? () => setMaximized(body) : undefined;
  const requestTabKey = `${path}/request`;
  const responseTabKey = `${path}/response`;
  const columnStyle: React.CSSProperties = isFullHeight
    ? { flex: 1, minWidth: 280, display: "flex", flexDirection: "column", minHeight: 0 }
    : { flex: 1, minWidth: 280 };
  const framed = (content: ReactNode) => (
    <div style={{ height: isFullHeight ? "100%" : 180, boxSizing: "border-box", overflow: "auto",
      border: "1px solid var(--color-border-default)", borderRadius: 6 }}>
      {content}
    </div>
  );
  const jsonView = (key: string, value: string) => (
    <ResizableJsonView storageKey={`${path}/${key}Height`} value={value} isFullHeight={isFullHeight} />
  );

  return (
    <div className="oc-request-response-tabs"
      style={{ display: "flex", gap: 16, flexWrap: "wrap", ...(isFullHeight ? { height: "100%", minHeight: 0 } : {}) }}>
      <div style={columnStyle}>
        <Tabs
          value={tabs[requestTabKey] ?? "body"}
          onChange={(key) => setTab(requestTabKey, key)}
          isFullHeight={isFullHeight}
          items={[
            {
              key: "header",
              label: <LabelWithCopy label={t("tabs.requestHeader")} value={requestHeader} />,
              content: requestHeaderContent ? framed(requestHeaderContent) : jsonView("request", requestHeader),
            },
            {
              key: "body",
              label: <LabelWithCopy label={t("tabs.requestBody")} value={requestPayload}
                onMaximize={maximize("request")} maximizeTestId="logs-maximize-request-body" />,
              content: requestBodyContent ? framed(requestBodyContent) : jsonView("request", requestPayload),
            },
          ]}
        />
      </div>
      <div style={columnStyle}>
        <Tabs
          value={tabs[responseTabKey] ?? "body"}
          onChange={(key) => setTab(responseTabKey, key)}
          isFullHeight={isFullHeight}
          items={[
            {
              key: "header",
              label: (
                <LabelWithCopy label={t("tabs.responseHeader")}
                  value={response.kind === "payload" ? response.header : null} />
              ),
              content: response.kind === "payload"
                ? jsonView("response", response.header)
                : response.content,
            },
            {
              key: "body",
              label: (
                <LabelWithCopy label={t("tabs.responseBody")}
                  value={response.kind === "payload" ? response.payload : null}
                  onMaximize={maximize("response")} maximizeTestId="logs-maximize-response-body" />
              ),
              content: response.kind === "payload"
                ? jsonView("response", response.payload)
                : response.content,
            },
          ]}
        />
      </div>
      {maximized === "request" && (
        <MaximizedBodyDialog title={t("tabs.requestBody")} onClose={() => setMaximized(null)}
          content={requestBodyContent ?? <ResizableJsonView storageKey={`${path}/requestMaximized`}
            value={requestPayload} isFullHeight />} />
      )}
      {maximized === "response" && response.kind === "payload" && (
        <MaximizedBodyDialog title={t("tabs.responseBody")} onClose={() => setMaximized(null)}
          content={<ResizableJsonView storageKey={`${path}/responseMaximized`} value={response.payload} isFullHeight />} />
      )}
    </div>
  );
}
