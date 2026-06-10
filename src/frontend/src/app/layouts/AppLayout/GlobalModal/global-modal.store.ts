import { create } from 'zustand';
import React from 'react';

export interface ModalOptions {
    /** Override the modal width. Defaults to 1000. Accepts e.g. 'fit-content'. */
    width?: number | string;
}

interface ModalState {
    content: React.ReactNode | null;
    isOpen: boolean;
    width?: number | string;

    open: (node: React.ReactNode, options?: ModalOptions) => void;
    close: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
    content: null,
    isOpen: false,
    width: undefined,

    open: (node, options) => set({ content: node, isOpen: true, width: options?.width }),
    close: () => set({ content: null, isOpen: false, width: undefined }),
}));
