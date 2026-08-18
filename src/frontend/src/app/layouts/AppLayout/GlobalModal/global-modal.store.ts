import { create } from 'zustand';
import React from 'react';

export interface ModalOptions {
    /** Override the modal width. Defaults to 1000. Accepts e.g. 'fit-content'. */
    width?: number | string;
    /** Override the modal's distance (px) from the viewport top. Defaults to 50 —
     * pass 18 to align with the entity form dialogs (see Dialog primitive's `top`). */
    top?: number;
}

interface ModalState {
    content: React.ReactNode | null;
    // Bumped on every open() so GlobalModal can key its content wrapper — without
    // it, re-opening with the same component type (e.g. re-running "create X" from
    // the command palette while the modal is still showing the previous success
    // state) just updates props in place instead of remounting, leaving stale
    // internal state (like a wizard's "submitted" flag) stuck on screen.
    contentKey: number;
    isOpen: boolean;
    width?: number | string;
    top?: number;

    open: (node: React.ReactNode, options?: ModalOptions) => void;
    close: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
    content: null,
    contentKey: 0,
    isOpen: false,
    width: undefined,
    top: undefined,

    open: (node, options) => set((state) => ({ content: node, contentKey: state.contentKey + 1, isOpen: true, width: options?.width, top: options?.top })),
    close: () => set({ content: null, isOpen: false, width: undefined, top: undefined }),
}));
