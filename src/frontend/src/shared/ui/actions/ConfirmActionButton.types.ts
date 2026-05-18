import type { ReactNode } from 'react';
import type { ConfirmOptions } from '@/shared/ui/confirm/ConfirmDialog.types';
import type {ButtonVariant} from "@shared/ui/primitives/Button/Button.types.ts";

export interface ConfirmActionButtonProps {
    /** confirm dialog config */
    confirm?: ConfirmOptions;

    /** action executed after confirm === true */
    onConfirm: () => void | Promise<void>;

    /** button appearance */
    variant?: ButtonVariant;
    disabled?: boolean;
    loading?: boolean;

    children: ReactNode;
}
