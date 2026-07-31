import { useState } from "react";
import { message } from "antd";
import { IconButton } from "@shared/ui/primitives/IconButton";
import { Tooltip } from "@shared/ui/primitives/Tooltip";
import { useI18n } from "@shared/i18n/hooks/useI18n";
import { apiExecutor } from "@shared/api/apiExecutor";

// Files at/above this size aren't streamed to the browser; the user is pointed
// to the server-side path instead (mirrors the legacy behaviour).
const MAX_DOWNLOAD_MB = 500;
// The "too big" message carries a server path worth reading, so keep it up
// longer than antd's 3s default.
const TOO_BIG_MESSAGE_DURATION_SEC = 10;

export function DownloadLogsButton({ executionId }: { executionId: string }) {
  const { t } = useI18n("logs");
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const blob = (await apiExecutor({
        url: `/execution/${executionId}/raw/log`,
        method: "GET",
        options: { responseType: "blob" },
      })) as Blob;

      if (blob.size / (1024 * 1024) >= MAX_DOWNLOAD_MB) {
        message.error(
          t("download.tooBig", { path: `src/backend/${executionId}` }),
          TOO_BIG_MESSAGE_DURATION_SEC,
        );
        return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `execution-${executionId}.log`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      message.error(t("download.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Tooltip content={t("download.tooltip")} placement="topLeft">
      <IconButton
        iconProps={{ name: "download" }}
        size="xs"
        type="text"
        loading={loading}
        onClick={handleDownload}
      />
    </Tooltip>
  );
}
