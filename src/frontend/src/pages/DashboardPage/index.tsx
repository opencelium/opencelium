import { Typography } from '@shared/ui/primitives/Typography'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import PageWrapper from '@pages/PageWrapper/PageWrapper'
import { MetricTiles } from './components/MetricTiles'
import { AttentionRequiredCard } from './components/AttentionRequiredCard'
import { RecentActivityCard } from './components/RecentActivityCard'
import { SystemHealthCard } from './components/SystemHealthCard'
import { ExecutionsChartCard } from './components/ExecutionsChartCard'
import { ResourceUsageCard } from './components/ResourceUsageCard'
import { TopConnectorsCard } from './components/TopConnectorsCard'
import { ComingSoonOverlay } from './components/ComingSoonOverlay'
import { useSocketConnectionNotifications } from './useSocketConnectionNotifications'

export default function DashboardPage() {
    const { t } = useI18n('dashboard')

    useSocketConnectionNotifications()

    return (
        <PageWrapper>
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                    <Typography variant="headline">{t('header.title')}</Typography>
                    <div style={{ marginTop: 4 }}>
                        <Typography isSubtle>{t('header.subtitle')}</Typography>
                    </div>
                </div>

                <MetricTiles />

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                        gap: 16,
                    }}
                >
                    <ComingSoonOverlay labelKey="waitingApi">
                        <ExecutionsChartCard />
                    </ComingSoonOverlay>
                    <ResourceUsageCard />
                    <ComingSoonOverlay labelKey="waitingApi">
                        <TopConnectorsCard />
                    </ComingSoonOverlay>
                </div>

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: 16,
                    }}
                >
                    <ComingSoonOverlay>
                        <AttentionRequiredCard />
                    </ComingSoonOverlay>
                    <ComingSoonOverlay>
                        <RecentActivityCard />
                    </ComingSoonOverlay>
                    <ComingSoonOverlay>
                        <SystemHealthCard />
                    </ComingSoonOverlay>
                </div>
            </div>
        </PageWrapper>
    )
}
