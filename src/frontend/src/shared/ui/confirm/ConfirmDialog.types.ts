import type { ReactNode } from 'react';
import type {ButtonVariant} from "@shared/ui/primitives/Button/Button.types.ts";

export interface ConfirmOptions {
    title?: ReactNode;
    message?: ReactNode;

    confirmText?: string;
    cancelText?: string;

    confirmVariant?: ButtonVariant;
    autoFocusConfirm?: boolean;
}

export interface ConfirmContextValue {
    confirm(options: ConfirmOptions): Promise<boolean>;
}
