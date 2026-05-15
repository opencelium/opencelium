import { Layout } from 'antd';
import { useLayoutStore } from '../layout.store';
import { Sidebar } from './Sidebar';
import {useBreakpoints} from "@app/hooks/useBreakpoints.tsx";

const { Sider } = Layout;

export const LayoutSidebar = () => {
    const collapsed = useLayoutStore((s) => s.collapsed);
    const {isMobile} = useBreakpoints();
    return (
        <Sider
            width={240}
            collapsedWidth={50}
            collapsible
            collapsed={collapsed}
            trigger={null}
            style={{
                height: '100vh',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                position: isMobile && !collapsed ? 'fixed' : 'relative',
                left: 0,
                top: 0,
                zIndex: isMobile && !collapsed ? 1000 : 'auto',
            }}
        >
            <Sidebar />
        </Sider>
    );
};
