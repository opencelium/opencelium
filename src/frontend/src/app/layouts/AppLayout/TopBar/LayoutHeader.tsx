import { Layout } from 'antd';
import { TopBar } from './TopBar';
import { useTheme } from '@shared/theme/hooks/useTheme';
import {ErrorBoundary} from "@shared/errors/boundary/ErrorBoundary.tsx";
import {WidgetCrash} from "@shared/ui/feedback/crash/WidgetCrash.tsx";

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
            <ErrorBoundary scope="widget" fallback={(props) => <WidgetCrash {...props} />}>
                <TopBar />
            </ErrorBoundary>
        </Header>
    );
};
