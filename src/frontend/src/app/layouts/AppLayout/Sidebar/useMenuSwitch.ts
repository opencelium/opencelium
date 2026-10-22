import {useNavigate, type NavigateFunction} from "react-router-dom";
import {useLayoutStore} from "@app/layouts/AppLayout/layout.store.ts";
import type {MenuType} from "@app/layouts/AppLayout/Sidebar/Sidebar.types.ts";

const currentLocation = () => `${window.location.pathname}${window.location.search}${window.location.hash}`;

/**
 * Lands on the page the user last visited in the target menu so the content area
 * visibly changes alongside the menu (it falls back to the menu's default landing
 * route when nothing has been visited yet).
 *
 * Navigates first and switches the menu only if the browser actually moved: the
 * workflow editor's leave guards wrap `history.push` and drop the navigation on
 * Cancel (or defer it behind an async confirm), and switching regardless would
 * leave the editor under the other menu. A deferred navigation that goes ahead
 * later switches the menu on arrival via NavigationMenu's route-owner effect.
 */
export const switchMenu = (navigate: NavigateFunction, target: MenuType) => {
    const {setMenu, lastPathByMenu} = useLayoutStore.getState();
    const destination = lastPathByMenu[target];
    const before = currentLocation();
    navigate(destination);
    if (currentLocation() !== before || before === destination) setMenu(target);
};

export const useMenuSwitch = () => {
    const navigate = useNavigate();
    const menuType = useLayoutStore((state) => state.menuType);

    const toggleMenu = () => switchMenu(navigate, menuType === 'main' ? 'admin' : 'main');

    const isMain = menuType === 'main';
    // `labelKey` carries the Alt+M hint for tooltips; `menuLabelKey` is the plain label for menu entries.
    const labelKey = isMain ? 'topbar.switchToAdminMenu' : 'topbar.switchToMainMenu';
    const menuLabelKey = isMain ? 'topbar.adminMenu' : 'topbar.mainMenu';

    return { menuType, toggleMenu, labelKey, menuLabelKey } as const;
};
