import React, { useCallback, useEffect, useRef, useState } from 'react';

import { Dialog } from '@/shared/ui/primitives/Dialog';
import { Button } from '@/shared/ui/primitives/Button';
import { useAppSelector } from '@shared/lib/storeHooks';
import { selectIsAuthenticated } from '@entities/auth/model/authSelectors';
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
    const [loading, setLoading] = useState(false);

    const resolverRef = useRef<((value: boolean) => void) | null>(null);

    const confirm = useCallback((options: ConfirmOptions) => {
        return new Promise<boolean>((resolve) => {
            resolverRef.current = resolve;
            setLoading(false);

            setState({
                ...options,
                open: true,
            });
        });
    }, []);

    const close = (result: boolean) => {
        const resolve = resolverRef.current;
        resolverRef.current = null;

        setLoading(false);
        setState({ open: false });

        // Defer the resolve until after the modal+backdrop have animated out,
        // so callers can render their pending UI on an unobscured page.
        window.setTimeout(() => resolve?.(result), CLOSE_ANIMATION_MS);
    };

    // When `onConfirm` is provided, run it with the confirm button in a loading
    // state and the dialog held open, so an API request started on confirm shows
    // its progress in place instead of closing immediately.
    const handleConfirm = async () => {
        if (!state.onConfirm) {
            close(true);
            return;
        }
        setLoading(true);
        try {
            await state.onConfirm();
            close(true);
        } catch {
            close(false);
        }
    };

    // When the session ends (expiry or logout) dismiss any open confirm and
    // resolve its awaiting caller with `false`, so the dialog doesn't linger on
    // the /login screen and the pending promise never hangs.
    const isAuthenticated = useAppSelector(selectIsAuthenticated);
    useEffect(() => {
        if (!isAuthenticated && resolverRef.current) close(false);
    }, [isAuthenticated]);

    return (
        <ConfirmDialogContext.Provider value={{ confirm }}>
            {children}

            <Dialog
                open={state.open}
                onClose={() => { if (!loading) close(false); }}
                title={state.title}
                closable={!loading}
                testId="confirm-dialog"
                zIndex={20000}
                footer={
                    <>
                        <Button
                            variant="secondary"
                            disabled={loading}
                            onClick={() => close(false)}
                            testId="confirm-dialog-cancel"
                        >
                            {state.cancelText ?? 'Cancel'}
                        </Button>

                        <Button
                            variant={state.confirmVariant ?? 'primary'}
                            loading={loading}
                            onClick={handleConfirm}
                            testId="confirm-dialog-confirm"
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
