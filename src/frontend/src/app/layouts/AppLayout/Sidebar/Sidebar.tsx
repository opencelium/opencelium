import { NavigationMenu } from './NavigationMenu';
import {LogoutOutlined, MenuFoldOutlined, MenuUnfoldOutlined} from "@ant-design/icons";
import {useLayoutStore} from "@app/layouts/AppLayout/layout.store.ts";
import {Button} from "@shared/ui/primitives/Button";
import {Tooltip} from "@shared/ui/primitives/Tooltip";
import {useTheme} from "@shared/theme/hooks/useTheme.tsx";
import {useI18n} from "@shared/i18n/hooks/useI18n.ts";
import {useAuth} from "@features/auth/useAuth.ts";
import {useConfirm} from "@shared/ui/confirm/ConfirmDialogContext";

export const Sidebar = () => {
    const { collapsed, toggleCollapsed } = useLayoutStore();
    const { theme } = useTheme();
    const { t: tCommon } = useI18n('common');
    const { logout } = useAuth();
    const confirm = useConfirm();

    const logoutLabel = tCommon('sidebar.logout');

    const handleLogout = async () => {
        const ok = await confirm({
            title: tCommon('sidebar.confirmLogout.title'),
            message: tCommon('sidebar.confirmLogout.message'),
        });
        if (!ok) return;
        await logout();
    };

    return (
        <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* HEADER — match the topbar height (50px) so the two align */}
            <div style={{
                height: 50,
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'flex-start',
                padding: `0 ${collapsed ? '0' : '5px'} 0 ${collapsed ? 0 : '12px'}`,
                borderBottom: `1px solid ${theme.color.border.subtle}`,
                boxSizing: 'border-box',
            }}>
                <Tooltip
                    content={tCommon(collapsed ? 'sidebar.expand' : 'sidebar.collapse')}
                    placement="right"
                >
                    <Button type="text" onClick={toggleCollapsed}>
                        {collapsed
                            ? <MenuUnfoldOutlined style={{ color: '#fff' }} />
                            : <MenuFoldOutlined style={{ color: '#fff' }} />
                        }
                    </Button>
                </Tooltip>
            </div>

            {/* SCROLLABLE MENU */}
            <div style={{
                flex: 1,
                overflowY: 'auto'
            }}>
                <NavigationMenu />
            </div>

            {/* FOOTER — logout */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'flex-start',
                padding: `8px ${collapsed ? '0' : '12px'}`,
                boxSizing: 'border-box',
            }}>
                <Tooltip content={logoutLabel} placement="right">
                    <Button
                        type="text"
                        onClick={() => { void handleLogout(); }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            width: collapsed ? undefined : '100%',
                            justifyContent: collapsed ? 'center' : 'flex-start',
                            color: '#fff',
                        }}
                    >
                        <LogoutOutlined style={{ color: '#fff' }} />
                        {!collapsed && <span>{logoutLabel}</span>}
                    </Button>
                </Tooltip>
            </div>
        </div>
    );
};
