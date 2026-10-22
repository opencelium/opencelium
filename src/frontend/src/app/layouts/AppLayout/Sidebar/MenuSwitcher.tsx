import {useMenuSwitch} from "@app/layouts/AppLayout/Sidebar/useMenuSwitch";
import {IconButton} from "@shared/ui/primitives/IconButton";
import {Tooltip} from "@shared/ui/primitives/Tooltip";
import {useI18n} from "@shared/i18n/hooks/useI18n.ts";

export const MenuSwitcher = () => {
    const { menuType, toggleMenu, labelKey } = useMenuSwitch();
    const { t: tCommon } = useI18n('common');

    return (
        <Tooltip content={tCommon(labelKey)}>
            <IconButton
                size="xs"
                type={menuType === 'admin' ? "primary" : "text"}
                iconProps={{ name: 'settings', color: menuType === 'admin' ? 'inherit' : 'primary' }}
                onClick={toggleMenu}
                testId="topbar-menu-switch"
            />
        </Tooltip>
    );
};
