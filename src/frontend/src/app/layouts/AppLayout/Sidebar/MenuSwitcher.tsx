import {useLayoutStore} from "@app/layouts/AppLayout/layout.store.ts";
import {IconButton} from "@shared/ui/primitives/IconButton";
import {Tooltip} from "@shared/ui/primitives/Tooltip";
import {useI18n} from "@shared/i18n/hooks/useI18n.ts";

export const MenuSwitcher = () => {
    const { menuType, setMenu } = useLayoutStore();
    const { t: tCommon } = useI18n('common');
    return (
        <Tooltip content={tCommon(menuType === 'main' ? 'topbar.switchToAdminMenu' : 'topbar.switchToMainMenu')}>
            <IconButton
                size="xs"
                type={menuType === 'admin' ? "primary" : "text"}
                iconProps={{ name: 'settings', color: menuType === 'admin' ? "secondary" : 'primary' }}
                onClick={() => setMenu(menuType === 'main' ? 'admin' : 'main')}
            />
        </Tooltip>
    );
};
