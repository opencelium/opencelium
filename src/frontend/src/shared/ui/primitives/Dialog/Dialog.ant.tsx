import React from 'react';
import { Modal } from 'antd';
import type { DialogComponent } from './Dialog.types';
import './dialog.ant.css';

export const AntDialog: DialogComponent = ({
    open,
    onClose,
    title,
    footer,
    children,
    width = 480,
    closable = true,
    fullscreen = false,
    afterClose,
}) => {
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    fullscreen = fullscreen || isMobile;
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
            width={fullscreen ? '100vw' : width}
            className={fullscreen ? 'ant-dialog-fullscreen' : 'ant-dialog-custom'}
        >
            {children}
        </Modal>
    );
};
