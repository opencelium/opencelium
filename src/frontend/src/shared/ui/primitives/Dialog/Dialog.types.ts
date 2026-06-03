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
    /** Shows a maximize/restore toggle next to the close icon. `fullscreen` seeds its initial state. */
    maximizable?: boolean;

    /** Fires once the dialog has fully unmounted from the DOM (after the close animation). */
    afterClose?: () => void;

    children: ReactNode;
}

export type DialogComponent = React.FC<DialogProps>;
