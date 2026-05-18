import React, { createContext, useContext, useState } from 'react';
import type { OpenDialogOptions } from './types';
import type { DialogStackItem } from './DialogStack.types';

interface DialogController {
    open: (options: OpenDialogOptions) => string;
    close: () => void;
    closeById: (id: string) => void;
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

    return (
        <DialogControllerContext.Provider
            value={{ open, close, closeById }}
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
