import { Loading } from "@shared/ui/primitives/Loading/Loading";
import { Typography } from "@shared/ui/primitives/Typography";
import { useI18n } from "@shared/i18n/hooks/useI18n";
import { useGetMethodDetailsQuery } from "../api/logsApi";
import { RequestResponseTabs } from "./RequestResponseTabs";
import { ErrorDetail } from "./ErrorDetail";

type Props = {
  id: string;
  depth: number;
  // Stable per-row path so view state (open tab / heights) is scoped to this
  // method and not shared with sibling rows.
  path: string;
};

export function MethodLogDetails({ id, depth, path }: Props) {
  const { t } = useI18n("logs");
  // A method's own detail never changes once logged — skip baseApi's default
  // refetch-on-mount so a warm cache entry (from a previous expand, or from
  // prefetchErrorTracePath's reveal warm-up) is reused as-is instead of a
  // redundant request flipping isFetching back to true.
  const { data, isFetching, isError } = useGetMethodDetailsQuery(id, {
    refetchOnMountOrArgChange: false,
  });

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

  return (
    <div style={wrapStyle}>
      <RequestResponseTabs
        path={path}
        requestHeader={request?.header ?? ""}
        requestPayload={request?.payload ?? ""}
        response={{ kind: "payload", header: response?.header ?? "", payload: response?.payload ?? "" }}
      />
    </div>
  );
}
