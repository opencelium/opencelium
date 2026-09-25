import { theme as antdTheme } from 'antd';
import { NavigationMenu } from './NavigationMenu';
import {LogoutOutlined, MenuFoldOutlined, MenuUnfoldOutlined} from "@ant-design/icons";
import {useLayoutStore} from "@app/layouts/AppLayout/layout.store.ts";
import {Button} from "@shared/ui/primitives/Button";
import {Tooltip} from "@shared/ui/primitives/Tooltip";
import {useTheme} from "@shared/theme/hooks/useTheme.tsx";
import {useI18n} from "@shared/i18n/hooks/useI18n.ts";
import {useAuth} from "@features/auth/useAuth.ts";
import {useConfirm} from "@shared/ui/confirm/ConfirmDialogContext";
import {AppLogo} from "@features/branding/AppLogo";

export const Sidebar = () => {
    const { collapsed, toggleCollapsed } = useLayoutStore();
    const { theme } = useTheme();
    // antd positions a submenu's expand arrow at `margin` from the item's right edge
    // (`insetInlineEnd: token.margin` in its Menu style). Reading the same token keeps
    // the logo on that gutter instead of a copied constant that could drift from it.
    const { token: antdToken } = antdTheme.useToken();
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
                padding: `0 ${collapsed ? 0 : antdToken.margin}px 0 ${collapsed ? 0 : 12}px`,
                borderBottom: `1px solid ${theme.color.sidebar.border}`,
                boxSizing: 'border-box',
            }}>
                <Tooltip
                    content={tCommon(collapsed ? 'sidebar.expand' : 'sidebar.collapse')}
                    placement="right"
                >
                    <Button type="text" onClick={toggleCollapsed}>
                        {collapsed
                            ? <MenuUnfoldOutlined style={{ color: theme.color.sidebar.fg }} />
                            : <MenuFoldOutlined style={{ color: theme.color.sidebar.fg }} />
                        }
                    </Button>
                </Tooltip>

                {/* Only while expanded: the 50px collapsed rail has no room for a
                    wordmark, and the toggle has to stay reachable. The header's right
                    padding puts its right edge on the submenu arrows' gutter below. */}
                {!collapsed && (
                    <AppLogo
                        height={24}
                        surfaceColor={theme.color.sidebar.bg}
                        style={{marginLeft: 'auto', maxWidth: 150}}
                        testId="sidebar-logo"
                    />
                )}
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
                            color: theme.color.sidebar.fg,
                        }}
                    >
                        <LogoutOutlined style={{ color: theme.color.sidebar.fg }} />
                        {!collapsed && <span>{logoutLabel}</span>}
                    </Button>
                </Tooltip>
            </div>
        </div>
    );
};
