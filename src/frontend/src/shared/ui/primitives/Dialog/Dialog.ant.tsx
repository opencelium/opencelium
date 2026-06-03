import React, { useState } from "react";
import { Modal } from "antd";
import { IconButton } from "@shared/ui/primitives/IconButton";
import { Tooltip } from "@shared/ui/primitives/Tooltip";
import { useI18n } from "@shared/i18n/hooks/useI18n";
import type { DialogComponent } from "./Dialog.types";
import { DialogFullscreenProvider } from "./DialogFullscreenContext";
import "./dialog.ant.css";

export const AntDialog: DialogComponent = ({
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
      className={isFullscreen ? "ant-dialog-fullscreen" : "ant-dialog-custom"}
    >
      {showMaximize && (
        <Tooltip content={t(maximized ? "dialog.restore" : "dialog.maximize")}>
          <span className="ant-dialog-maximize-btn">
            <IconButton
              iconProps={{ name: maximized ? "minimize" : "maximize" }}
              size="xs"
              type="text"
              onClick={() => setMaximized((v) => !v)}
            />
          </span>
        </Tooltip>
      )}
      <DialogFullscreenProvider value={isFullscreen}>
        {children}
      </DialogFullscreenProvider>
    </Modal>
  );
};
