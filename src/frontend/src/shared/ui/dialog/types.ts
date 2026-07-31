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
    /** Stable selector for e2e tests; emitted as `data-testid` on the dialog body. */
    testId?: string;
}
export interface ConfirmOptions {
    title?: string;
    message: string;

    confirmText?: string;
    cancelText?: string;

    danger?: boolean;
}
