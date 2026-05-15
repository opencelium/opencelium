import { useState } from 'react'
import { Typography } from '@shared/ui/primitives/Typography'
import { Select } from '@shared/ui/primitives/Select'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import PageWrapper from '@pages/PageWrapper/PageWrapper'
import { MetricTiles } from './components/MetricTiles'
import { AttentionRequiredCard } from './components/AttentionRequiredCard'
import { RecentActivityCard } from './components/RecentActivityCard'
import { SystemHealthCard } from './components/SystemHealthCard'
import { ExecutionsChartCard } from './components/ExecutionsChartCard'
import { ResourceUsageCard } from './components/ResourceUsageCard'
import { TopConnectorsCard } from './components/TopConnectorsCard'

type DashboardRange = 'last7days' | 'last30days' | 'last24h'

export default function DashboardPage() {
    const { t } = useI18n('dashboard')
    const [range, setRange] = useState<DashboardRange>('last7days')

    const rangeOptions = [
        { value: 'last24h', label: t('rangeFilter.last24h') },
        { value: 'last7days', label: t('rangeFilter.last7days') },
        { value: 'last30days', label: t('rangeFilter.last30days') },
    ] as const

    return (
        <PageWrapper>
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: 16,
                        flexWrap: 'wrap',
                    }}
                >
                    <div>
                        <Typography variant="headline">{t('header.title')}</Typography>
                        <div style={{ marginTop: 4 }}>
                            <Typography isSubtle>{t('header.subtitle')}</Typography>
                        </div>
                    </div>
                    <div style={{ minWidth: 180 }}>
                        <Select<DashboardRange>
                            value={range}
                            onChange={setRange}
                            options={[...rangeOptions]}
                        />
                    </div>
                </div>

                <MetricTiles />

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: 16,
                    }}
                >
                    <AttentionRequiredCard />
                    <RecentActivityCard />
                    <SystemHealthCard />
                </div>

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                        gap: 16,
                    }}
                >
                    <ExecutionsChartCard />
                    <ResourceUsageCard />
                    <TopConnectorsCard />
                </div>
            </div>
        </PageWrapper>
    )
}
