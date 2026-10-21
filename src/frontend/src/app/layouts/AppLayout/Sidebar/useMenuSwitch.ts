import {useNavigate} from "react-router-dom";
import {useLayoutStore} from "@app/layouts/AppLayout/layout.store.ts";

export const useMenuSwitch = () => {
    const navigate = useNavigate();
    const { menuType, setMenu, lastPathByMenu } = useLayoutStore();

    const toggleMenu = () => {
        const target = menuType === 'main' ? 'admin' : 'main';
        setMenu(target);
        // Land on the page the user last visited in the target menu so the
        // content area visibly changes alongside the menu (it falls back to the
        // menu's default landing route when nothing has been visited yet).
        navigate(lastPathByMenu[target]);
    };

    const isMain = menuType === 'main';
    // `labelKey` carries the Alt+M hint for tooltips; `menuLabelKey` is the plain label for menu entries.
    const labelKey = isMain ? 'topbar.switchToAdminMenu' : 'topbar.switchToMainMenu';
    const menuLabelKey = isMain ? 'topbar.adminMenu' : 'topbar.mainMenu';

    return { menuType, toggleMenu, labelKey, menuLabelKey } as const;
};
