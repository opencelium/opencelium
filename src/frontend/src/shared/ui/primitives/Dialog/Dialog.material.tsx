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

export const MaterialDialog: DialogComponent = ({
  open,
  onClose,
  title,
  footer,
  children,
  width = 480,
  closable = true,
  fullscreen = false,
  maximizable = false,
  afterClose,
}) => {
  const { t } = useI18n("common");
  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  const [maximized, setMaximized] = useState(fullscreen);
  const isFullscreen = isMobile || maximized;
  const showMaximize = maximizable && !isMobile;

  return (
    <MuiDialog
      open={open}
      onClose={closable ? onClose : undefined}
      TransitionProps={afterClose ? { onExited: afterClose } : undefined}
      fullScreen={isFullscreen}
      maxWidth={false}
      PaperProps={{
        sx: {
          width: isFullscreen ? "100%" : width,
          borderRadius: isFullscreen ? 0 : "var(--radius-lg)",
          marginBottom: isFullscreen ? 0 : "40px",
          position: "relative",
        },
      }}
    >
      {showMaximize && (
        <Tooltip content={t(maximized ? "dialog.restore" : "dialog.maximize")}>
          <span
            style={{
              position: "absolute",
              top: 8,
              insetInlineEnd: 8,
              zIndex: 10,
            }}
          >
            <IconButton
              iconProps={{ name: maximized ? "minimize" : "maximize" }}
              size="xs"
              type="text"
              onClick={() => setMaximized((v) => !v)}
            />
          </span>
        </Tooltip>
      )}

      {title && <DialogTitle>{title}</DialogTitle>}

      <DialogContent dividers>
        <DialogFullscreenProvider value={isFullscreen}>
          {children}
        </DialogFullscreenProvider>
      </DialogContent>

      {footer && <DialogActions>{footer}</DialogActions>}
    </MuiDialog>
  );
};
