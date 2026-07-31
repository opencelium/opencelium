import { createContext, useContext } from 'react';
import type { ConfirmContextValue } from './ConfirmDialog.types';

const ConfirmDialogContext =
    createContext<ConfirmContextValue | null>(null);

export function useConfirm() {
    const ctx = useContext(ConfirmDialogContext);
    if (!ctx) {
        throw new Error('useConfirm must be used inside ConfirmDialogProvider');
    }
    return ctx.confirm;
}

export default ConfirmDialogContext;
