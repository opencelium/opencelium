import {useNavigate} from "react-router-dom";
import {useLayoutStore} from "@app/layouts/AppLayout/layout.store.ts";
import {IconButton} from "@shared/ui/primitives/IconButton";
import {Tooltip} from "@shared/ui/primitives/Tooltip";
import {useI18n} from "@shared/i18n/hooks/useI18n.ts";

export const MenuSwitcher = () => {
    const navigate = useNavigate();
    const { menuType, setMenu, lastPathByMenu } = useLayoutStore();
    const { t: tCommon } = useI18n('common');

    const toggleMenu = () => {
        const target = menuType === 'main' ? 'admin' : 'main';
        setMenu(target);
        // Land on the page the user last visited in the target menu so the
        // content area visibly changes alongside the menu (it falls back to the
        // menu's default landing route when nothing has been visited yet).
        navigate(lastPathByMenu[target]);
    };

    return (
        <Tooltip content={tCommon(menuType === 'main' ? 'topbar.switchToAdminMenu' : 'topbar.switchToMainMenu')}>
            <IconButton
                size="xs"
                type={menuType === 'admin' ? "primary" : "text"}
                iconProps={{ name: 'settings', color: menuType === 'admin' ? 'inherit' : 'primary' }}
                onClick={toggleMenu}
            />
        </Tooltip>
    );
};
