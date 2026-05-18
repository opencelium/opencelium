import { create } from 'zustand';
import React from 'react';

interface ModalState {
    content: React.ReactNode | null;
    isOpen: boolean;

    open: (node: React.ReactNode) => void;
    close: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
    content: null,
    isOpen: false,

    open: (node) => set({ content: node, isOpen: true }),
    close: () => set({ content: null, isOpen: false }),
}));
