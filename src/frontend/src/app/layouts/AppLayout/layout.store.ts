import { create } from 'zustand';
import type {LayoutState, MenuType} from "@app/layouts/AppLayout/Sidebar/Sidebar.types.ts";

const OPEN_SUBMENU_KEYS_STORAGE = 'openSubmenuKeys';
const LAST_PATH_BY_MENU_STORAGE = 'lastPathByMenu';

// Landing page each menu falls back to before the user has visited anything in it.
const DEFAULT_LAST_PATH: Record<MenuType, string> = { main: '/', admin: '/user' };

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

const readLastPathByMenu = (): Record<MenuType, string> => {
    try {
        const raw = localStorage.getItem(LAST_PATH_BY_MENU_STORAGE);
        if (!raw) return { ...DEFAULT_LAST_PATH };
        const parsed = JSON.parse(raw);
        return {
            main: typeof parsed?.main === 'string' ? parsed.main : DEFAULT_LAST_PATH.main,
            admin: typeof parsed?.admin === 'string' ? parsed.admin : DEFAULT_LAST_PATH.admin,
        };
    } catch {
        return { ...DEFAULT_LAST_PATH };
    }
};

export const useLayoutStore = create<LayoutState>((set) => ({
    collapsed: (localStorage.getItem('collapsed') === '1') || false,
    showCommandContent: false,
    isContentLoading: false,
    menuType: (localStorage.getItem('menuType') as MenuType) || 'main',
    openSubmenuKeys: readOpenSubmenuKeys(),
    lastPathByMenu: readLastPathByMenu(),
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
    setLastPath: (menu, path) => set((s) => {
        if (s.lastPathByMenu[menu] === path) return {};
        const next = { ...s.lastPathByMenu, [menu]: path };
        localStorage.setItem(LAST_PATH_BY_MENU_STORAGE, JSON.stringify(next));
        return { lastPathByMenu: next };
    }),
}));
