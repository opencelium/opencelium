export type MenuType = 'main' | 'admin';

export type LayoutState = {
    menuType: MenuType;
    collapsed: boolean;
    showCommandContent: boolean;
    isContentLoading: boolean;
    openSubmenuKeys: string[];
    toggleIsContentLoading: (value: boolean) => void;
    toggleCollapsed: () => void;
    toggleCommandContent: (value: boolean) => void;
    setMenu: (type: MenuType) => void;
    setOpenSubmenuKeys: (keys: string[]) => void;
};
