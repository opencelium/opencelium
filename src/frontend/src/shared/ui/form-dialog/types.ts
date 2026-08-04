import type { ReactNode } from 'react';
import type { ZodTypeAny } from 'zod';
import type {UseFormReturn} from "react-hook-form";
import type {ConfirmOptions} from "@shared/ui/confirm/ConfirmDialog.types.ts";

export interface UseFormDialogOptions<T> extends UseFormDialogOptions<T> {
    title: ReactNode;
    fullscreen?: boolean;

    schema: ZodTypeAny;
    initialValues?: Partial<T>;
    submitText?: string;
    cancelText?: string;
    onSubmit: (values: T) => Promise<void> | void;
    confirmOptions?: ConfirmOptions;
    render: (ctx: {
        form: UseFormReturn<T>;
        close: () => void;
    }) => ReactNode;
}
