import type { ReactNode } from 'react';
import type {ButtonVariant} from "@shared/ui/primitives/Button/Button.types.ts";

export interface ConfirmOptions {
    title?: ReactNode;
    message?: ReactNode;

    confirmText?: string;
    cancelText?: string;

    confirmVariant?: ButtonVariant;
    autoFocusConfirm?: boolean;

    /** Overrides the dialog's default width, for content that is a task rather
     *  than a sentence — a list of choices needs room the default does not give. */
    width?: number | string;

    /**
     * Action to run when the user confirms. While it is in flight the confirm
     * button shows a spinner and the dialog stays open (cancel/close disabled).
     * On success the dialog closes and `confirm()` resolves `true`; if it throws,
     * the dialog closes and `confirm()` resolves `false` so callers skip their
     * success path (the failure itself is surfaced by the action, e.g. errorBus).
     */
    onConfirm?: () => Promise<void> | void;
}

export interface ConfirmContextValue {
    confirm(options: ConfirmOptions): Promise<boolean>;
}
