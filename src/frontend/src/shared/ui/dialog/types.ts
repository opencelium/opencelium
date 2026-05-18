import type { ReactNode } from 'react';

export interface OpenDialogOptions {
    title?: ReactNode;
    content: ReactNode;
    footer?: ReactNode;
    width?: number | string;
    closable?: boolean;
    fullscreen?: boolean;
}
export interface ConfirmOptions {
    title?: string;
    message: string;

    confirmText?: string;
    cancelText?: string;

    danger?: boolean;
}
