import React from 'react';
import type { DialogProps } from './Dialog.types';
import {useDynamicUI} from "@app/providers/ui/DynamicFacade.tsx";

export function Dialog(props: DialogProps) {
    const { Dialog } = useDynamicUI();
    return <Dialog {...props} />;
}
