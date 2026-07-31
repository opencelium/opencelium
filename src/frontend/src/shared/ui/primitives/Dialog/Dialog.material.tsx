import React, { useState } from "react";
import {
  Dialog as MuiDialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { IconButton } from "@shared/ui/primitives/IconButton";
import { Tooltip } from "@shared/ui/primitives/Tooltip";
import { useI18n } from "@shared/i18n/hooks/useI18n";
import type { DialogComponent } from "./Dialog.types";
import { DialogFullscreenProvider } from "./DialogFullscreenContext";
import { DialogHeaderSlotProvider } from "./DialogHeaderSlotContext";

export const MaterialDialog: DialogComponent = ({
  open,
  onClose,
  title,
  footer,
  children,
  width = 480,
  top,
  closable = true,
  fullscreen = false,
  maximizable = false,
  afterClose,
  afterOpenChange,
  testId,
  zIndex,
}) => {
  const { t } = useI18n("common");
  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  const [maximized, setMaximized] = useState(fullscreen);
  const [headerSlot, setHeaderSlot] = useState<HTMLSpanElement | null>(null);
  const isFullscreen = isMobile || maximized;
  const showMaximize = maximizable && !isMobile;
  const sx = {
    ...(zIndex !== undefined ? { zIndex } : {}),
    ...(!isFullscreen && top !== undefined
      ? { "& .MuiDialog-container": { alignItems: "flex-start" } }
      : {}),
  };

  return (
    <MuiDialog
      open={open}
      onClose={closable ? onClose : undefined}
      TransitionProps={{
        onEntered: afterOpenChange ? () => afterOpenChange(true) : undefined,
        onExited: () => {
          afterClose?.();
          afterOpenChange?.(false);
        },
      }}
      fullScreen={isFullscreen}
      maxWidth={false}
      sx={Object.keys(sx).length ? sx : undefined}
      PaperProps={{
        sx: {
          width: isFullscreen ? "100%" : width,
          borderRadius: isFullscreen ? 0 : "var(--radius-lg)",
          marginTop: !isFullscreen && top !== undefined ? top : undefined,
          marginBottom: isFullscreen ? 0 : "40px",
          position: "relative",
        },
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 8,
          insetInlineEnd: 8,
          zIndex: 10,
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        <span ref={setHeaderSlot} style={{ display: "inline-flex", gap: 4 }} />
        {showMaximize && (
          <Tooltip
            content={t(maximized ? "dialog.restore" : "dialog.maximize")}
          >
            <IconButton
              iconProps={{ name: maximized ? "minimize" : "maximize" }}
              size="xs"
              type="text"
              onClick={() => setMaximized((v) => !v)}
            />
          </Tooltip>
        )}
      </span>

      {title && <DialogTitle>{title}</DialogTitle>}

      <DialogContent dividers data-testid={testId}>
        <DialogFullscreenProvider value={isFullscreen}>
          <DialogHeaderSlotProvider value={headerSlot}>
            {children}
          </DialogHeaderSlotProvider>
        </DialogFullscreenProvider>
      </DialogContent>

      {footer && <DialogActions>{footer}</DialogActions>}
    </MuiDialog>
  );
};
