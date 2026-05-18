import { Layout } from 'antd';
import { TopBar } from './TopBar';
import { useTheme } from '@shared/theme/hooks/useTheme';

const { Header } = Layout;

export const LayoutHeader = () => {
    const { theme } = useTheme();
    return (
        <Header
            style={{
                padding: '0 16px',
                background: theme.color.background.surface,
                borderBottom: `1px solid ${theme.color.border.subtle}`,
                height: '50px',
            }}
        >
            <TopBar />
        </Header>
    );
};
