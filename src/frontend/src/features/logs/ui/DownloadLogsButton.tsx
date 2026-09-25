import { useState } from "react";
import { IconButton } from "@shared/ui/primitives/IconButton";
import { Tooltip } from "@shared/ui/primitives/Tooltip";
import { useI18n } from "@shared/i18n/hooks/useI18n";
import { apiExecutor } from "@shared/api/apiExecutor";
import { notifyError } from '@shared/ui/feedback/notifyError';

// Files at/above this size aren't streamed to the browser; the user is pointed
// to the server-side path instead (mirrors the legacy behaviour).
const MAX_DOWNLOAD_MB = 500;

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
        notifyError(t("download.tooBig", { path: `src/backend/${executionId}` }));
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
      notifyError(t("download.error"));
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
