import type { ReactNode } from 'react';
import React from "react";

export interface DialogProps {
    open: boolean;
    onClose: () => void;

    title?: ReactNode;
    footer?: ReactNode;

    width?: number | string;
    closable?: boolean;
    fullscreen?: boolean;

    /** Fires once the dialog has fully unmounted from the DOM (after the close animation). */
    afterClose?: () => void;

    children: ReactNode;
}

export type DialogComponent = React.FC<DialogProps>;
