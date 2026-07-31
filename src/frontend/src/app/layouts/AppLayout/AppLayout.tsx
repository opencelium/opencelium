import { Layout } from 'antd';
import { LayoutHeader } from './TopBar/LayoutHeader.tsx';
import {LayoutSidebar} from "@app/layouts/AppLayout/Sidebar/LayoutSidebar.tsx";
import {LayoutContent} from "@app/layouts/AppLayout/Content/LayoutContent.tsx";
import {GlobalModal} from "@app/layouts/AppLayout/GlobalModal/GlobalModal.tsx";
import {SubscriptionAlert} from "@widgets/SubscriptionAlert/SubscriptionAlert.tsx";
import {useGlobalHotkeys} from "@app/hooks/useGlobalHotkeys.ts";

type AppLayoutProps = {
    isNotCard?: boolean;
    hasNoHeader?: boolean;
}
export const AppLayout = ({isNotCard, hasNoHeader}: AppLayoutProps) => {
    useGlobalHotkeys();

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <LayoutSidebar />

            <Layout style={{ height: '100vh', overflow: 'hidden' }}>
                {!hasNoHeader && <LayoutHeader />}
                <SubscriptionAlert />
                <LayoutContent isNotCard={isNotCard}/>
            </Layout>

            <GlobalModal />
        </Layout>
    );
};
