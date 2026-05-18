import React, { useCallback, useRef, useState } from 'react';

import { Dialog } from '@/shared/ui/primitives/Dialog';
import { Button } from '@/shared/ui/primitives/Button';
import type {ConfirmOptions} from "@shared/ui/confirm/ConfirmDialog.types.ts";
import ConfirmDialogContext from "@shared/ui/confirm/ConfirmDialogContext.tsx";

interface InternalState extends ConfirmOptions {
    open: boolean;
}

// Wait for the modal close animation (~250ms) plus a small buffer before
// resolving the awaited promise. Otherwise the caller's next render (e.g. a
// Switch flipping `loading=true`) lands while the AntD backdrop is still
// fading, so the user never sees the spinner.
const CLOSE_ANIMATION_MS = 320;

export const ConfirmDialogProvider: React.FC<{
    children: React.ReactNode;
}> = ({ children }) => {
    const [state, setState] = useState<InternalState>({ open: false });

    const resolverRef = useRef<((value: boolean) => void) | null>(null);

    const confirm = useCallback((options: ConfirmOptions) => {
        return new Promise<boolean>((resolve) => {
            resolverRef.current = resolve;

            setState({
                ...options,
                open: true,
            });
        });
    }, []);

    const close = (result: boolean) => {
        const resolve = resolverRef.current;
        resolverRef.current = null;

        setState({ open: false });

        // Defer the resolve until after the modal+backdrop have animated out,
        // so callers can render their pending UI on an unobscured page.
        window.setTimeout(() => resolve?.(result), CLOSE_ANIMATION_MS);
    };

    return (
        <ConfirmDialogContext.Provider value={{ confirm }}>
            {children}

            <Dialog
                open={state.open}
                onClose={() => close(false)}
                title={state.title}
                footer={
                    <>
                        <Button
                            variant="secondary"
                            onClick={() => close(false)}
                        >
                            {state.cancelText ?? 'Cancel'}
                        </Button>

                        <Button
                            variant={state.confirmVariant ?? 'primary'}
                            onClick={() => close(true)}
                        >
                            {state.confirmText ?? 'Confirm'}
                        </Button>
                    </>
                }
            >
                {state.message}
            </Dialog>
        </ConfirmDialogContext.Provider>
    );
};
