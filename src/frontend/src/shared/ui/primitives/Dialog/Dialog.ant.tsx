import React, { useState } from "react";
import { Modal } from "antd";
import { IconButton } from "@shared/ui/primitives/IconButton";
import { Tooltip } from "@shared/ui/primitives/Tooltip";
import { useI18n } from "@shared/i18n/hooks/useI18n";
import type { DialogComponent } from "./Dialog.types";
import { DialogFullscreenProvider } from "./DialogFullscreenContext";
import { DialogHeaderSlotProvider } from "./DialogHeaderSlotContext";
import "./dialog.ant.css";

export const AntDialog: DialogComponent = ({
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
  testId,
  zIndex,
}) => {
  const { t } = useI18n("common");
  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  const [maximized, setMaximized] = useState(fullscreen);
  const [headerSlot, setHeaderSlot] = useState<HTMLSpanElement | null>(null);
  // On mobile the dialog is always fullscreen and the toggle is hidden.
  const isFullscreen = isMobile || maximized;
  const showMaximize = maximizable && !isMobile;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      afterClose={afterClose}
      // antd renders default OK/Cancel when footer is undefined; coerce to null
      // so our primitive matches the Material adapter (no footer = no footer).
      footer={footer ?? null}
      title={title}
      closable={closable}
      width={isFullscreen ? "100%" : width}
      zIndex={zIndex}
      style={!isFullscreen && top !== undefined ? { top } : undefined}
      className={isFullscreen ? "ant-dialog-fullscreen" : "ant-dialog-custom"}
    >
      <span className="ant-dialog-header-actions">
        {/* Portal target for content-contributed actions (e.g. download). */}
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
      <DialogFullscreenProvider value={isFullscreen}>
        <DialogHeaderSlotProvider value={headerSlot}>
          <div data-testid={testId} style={{ display: "contents" }}>
            {children}
          </div>
        </DialogHeaderSlotProvider>
      </DialogFullscreenProvider>
    </Modal>
  );
};
