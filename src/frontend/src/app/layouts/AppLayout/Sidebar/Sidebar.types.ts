export type MenuType = 'main' | 'admin';

export type LayoutState = {
    menuType: MenuType;
    collapsed: boolean;
    showCommandContent: boolean;
    isContentLoading: boolean;
    openSubmenuKeys: string[];
    lastPathByMenu: Record<MenuType, string>;
    toggleIsContentLoading: (value: boolean) => void;
    toggleCollapsed: () => void;
    /** Collapses without saving the choice — for layout-driven collapses the user didn't ask for. */
    collapse: () => void;
    toggleCommandContent: (value: boolean) => void;
    setMenu: (type: MenuType) => void;
    setOpenSubmenuKeys: (keys: string[]) => void;
    setLastPath: (menu: MenuType, path: string) => void;
};
