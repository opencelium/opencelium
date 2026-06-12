import type { ReactNode } from 'react';

export interface OpenDialogOptions {
    title?: ReactNode;
    content: ReactNode;
    footer?: ReactNode;
    width?: number | string;
    top?: number | string;
    closable?: boolean;
    fullscreen?: boolean;
    maximizable?: boolean;
}
export interface ConfirmOptions {
    title?: string;
    message: string;

    confirmText?: string;
    cancelText?: string;

    danger?: boolean;
}
