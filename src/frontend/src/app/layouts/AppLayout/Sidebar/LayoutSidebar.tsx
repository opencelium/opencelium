import { useEffect } from 'react';
import { Layout } from 'antd';
import { useLayoutStore } from '../layout.store';
import { Sidebar } from './Sidebar';
import {useBreakpoints} from "@app/hooks/useBreakpoints.tsx";
import {ErrorBoundary} from "@shared/errors/boundary/ErrorBoundary.tsx";
import {WidgetCrash} from "@shared/ui/feedback/crash/WidgetCrash.tsx";

const { Sider } = Layout;

const AUTO_COLLAPSE_BELOW_WIDTH = 800;

export const LayoutSidebar = () => {
    const collapsed = useLayoutStore((s) => s.collapsed);
    const collapse = useLayoutStore((s) => s.collapse);
    const {isMobile, width} = useBreakpoints();
    const isNarrow = width < AUTO_COLLAPSE_BELOW_WIDTH;

    // Fires on the way into a narrow window (or a load at one), not on every render
    // while narrow, so a user who opens the sidebar again on a small screen keeps it open.
    useEffect(() => {
        if (isNarrow) collapse();
    }, [isNarrow, collapse]);
    return (
        <Sider
            width={240}
            collapsedWidth={50}
            collapsible
            collapsed={collapsed}
            trigger={null}
            theme="light"
            style={{
                height: '100vh',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                position: isMobile && !collapsed ? 'fixed' : 'relative',
                left: 0,
                top: 0,
                zIndex: isMobile && !collapsed ? 1000 : 'auto',
                // The sidebar owns its surface tokens: it follows the theme by
                // default, or carries a per-theme color (CI slate, custom seed).
                background: 'var(--color-sidebar-bg)',
                borderRight: '1px solid var(--color-sidebar-border)',
            }}
        >
            <ErrorBoundary scope="widget" fallback={(props) => <WidgetCrash {...props} />}>
                <Sidebar />
            </ErrorBoundary>
        </Sider>
    );
};
