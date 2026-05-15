import { NavigationMenu } from './NavigationMenu';
import {MenuFoldOutlined, MenuUnfoldOutlined} from "@ant-design/icons";
import {useLayoutStore} from "@app/layouts/AppLayout/layout.store.ts";
import {Button} from "@shared/ui/primitives/Button";
import {Tooltip} from "@shared/ui/primitives/Tooltip";
import {useTheme} from "@shared/theme/hooks/useTheme.tsx";
import {useI18n} from "@shared/i18n/hooks/useI18n.ts";

export const Sidebar = () => {
    const { collapsed, toggleCollapsed } = useLayoutStore();
    const { theme } = useTheme();
    const { t: tCommon } = useI18n('common');

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
        </div>
    );
};
