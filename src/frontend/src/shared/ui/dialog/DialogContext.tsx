import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAppSelector } from '@shared/lib/storeHooks';
import { selectIsAuthenticated } from '@entities/auth/model/authSelectors';
import type { OpenDialogOptions } from './types';
import type { DialogStackItem } from './DialogStack.types';

interface DialogController {
    open: (options: OpenDialogOptions) => string;
    close: () => void;
    closeById: (id: string) => void;
    closeAll: () => void;
}

const DialogControllerContext =
    createContext<DialogController | null>(null);

const DialogStackContext =
    createContext<DialogStackItem[] | null>(null);

const createId = () => Math.random().toString(36).slice(2);

export const DialogProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [stack, setStack] = useState<DialogStackItem[]>([]);

    const open = (options: OpenDialogOptions) => {
        const id = createId();

        setStack((prev) => [
            ...prev,
            {
                id,
                open: true,
                ...options,
            },
        ]);

        return id;
    };

    const close = () => {
        setStack((prev) => prev.slice(0, -1));
    };

    const closeById = (id: string) => {
        setStack((prev) => prev.filter((d) => d.id !== id));
    };

    const closeAll = () => {
        setStack((prev) => (prev.length ? [] : prev));
    };

    // Globally hosted dialogs live in this stack outside <Routes>, so unlike
    // route-local modals they don't unmount when the session ends and the app
    // redirects to /login. Drop them when auth is lost so none linger.
    const isAuthenticated = useAppSelector(selectIsAuthenticated);
    useEffect(() => {
        if (!isAuthenticated) closeAll();
    }, [isAuthenticated]);

    return (
        <DialogControllerContext.Provider
            value={{ open, close, closeById, closeAll }}
        >
            <DialogStackContext.Provider value={stack}>
                {children}
            </DialogStackContext.Provider>
        </DialogControllerContext.Provider>
    );
};

export function useDialogController() {
    const ctx = useContext(DialogControllerContext);
    if (!ctx) {
        throw new Error('useDialog must be used inside DialogProvider');
    }
    return ctx;
}

export function useDialogStack() {
    const ctx = useContext(DialogStackContext);
    if (!ctx) {
        throw new Error('DialogStack must be used inside DialogProvider');
    }
    return ctx;
}
