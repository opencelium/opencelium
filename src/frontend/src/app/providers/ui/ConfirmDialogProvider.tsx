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

    // Move focus to the default button (Cancel, unless `autoFocusConfirm`) once
    // the open animation settles. Doing it here — not via the button's autoFocus
    // — is what actually works: rc-dialog focuses the dialog itself on the
    // motion's visible-change, and this fires right after, overriding it.
    const handleAfterOpenChange = (opened: boolean) => {
        if (!opened) return;
        // Single confirm dialog at a time (singleton provider), so a document
        // query by the button's stable test id is safe and avoids wrapping the
        // footer (which would break antd's adjacent-button spacing).
        const selector = state.autoFocusConfirm
            ? '[data-testid="confirm-dialog-confirm"]'
            : '[data-testid="confirm-dialog-cancel"]';
        document.querySelector<HTMLButtonElement>(selector)?.focus();
    };

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
                afterOpenChange={handleAfterOpenChange}
                title={state.title}
                closable={!loading}
                testId="confirm-dialog"
                zIndex={20000}
                width={state.width}
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
                {typeof state.message === 'string' ? (
                    <div style={{ whiteSpace: 'pre-line' }}>{state.message}</div>
                ) : (
                    state.message
                )}
            </Dialog>
        </ConfirmDialogContext.Provider>
    );
};
