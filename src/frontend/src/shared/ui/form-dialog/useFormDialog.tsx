import React from 'react';
import { useDialog } from '@/shared/ui/dialog/useDialog';
import type {UseFormDialogOptions} from "@shared/ui/form-dialog/types.ts";
import FormDialogContent from "@shared/ui/form-dialog/FomDialogContent.tsx";

export function useFormDialog<T>(options: UseFormDialogOptions<T>) {
    const dialog = useDialog();
    const {title, fullscreen, ...dialogOptions} = options;
    return () => {
        dialog.open({
            title,
            fullscreen,
            content: (
                <FormDialogContent
                    {...dialogOptions}
                />
            ),
            closable: false,
        });
    };
}
