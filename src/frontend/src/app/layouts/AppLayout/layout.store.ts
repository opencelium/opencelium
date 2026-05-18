import { create } from 'zustand';
import type {LayoutState, MenuType} from "@app/layouts/AppLayout/Sidebar/Sidebar.types.ts";

const OPEN_SUBMENU_KEYS_STORAGE = 'openSubmenuKeys';

const readOpenSubmenuKeys = (): string[] => {
    try {
        const raw = localStorage.getItem(OPEN_SUBMENU_KEYS_STORAGE);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.filter((k): k is string => typeof k === 'string') : [];
    } catch {
        return [];
    }
};

export const useLayoutStore = create<LayoutState>((set) => ({
    collapsed: (localStorage.getItem('collapsed') === '1') || false,
    showCommandContent: false,
    isContentLoading: false,
    menuType: (localStorage.getItem('menuType') as MenuType) || 'main',
    openSubmenuKeys: readOpenSubmenuKeys(),
    toggleCollapsed: () => set((s) => {
        localStorage.setItem('collapsed', !s.collapsed ? '1' : '0');
        return { collapsed: !s.collapsed }
    }),
    toggleCommandContent: (value) => set({ showCommandContent: value }),
    toggleIsContentLoading: (value) => set({ isContentLoading: value }),
    setMenu: (type) => set((s) => {
        localStorage.setItem('menuType', type);
        return { menuType: type };
    }),
    setOpenSubmenuKeys: (keys) => set(() => {
        localStorage.setItem(OPEN_SUBMENU_KEYS_STORAGE, JSON.stringify(keys));
        return { openSubmenuKeys: keys };
    }),
}));
