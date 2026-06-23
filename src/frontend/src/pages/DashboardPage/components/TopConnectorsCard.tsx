import { Card } from '@shared/ui/primitives/Card'
import { Typography } from '@shared/ui/primitives/Typography'
import { Loading } from '@shared/ui/primitives/Loading/Loading'
import { Empty } from '@shared/ui/primitives/Empty'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { useGetTopWorkflowsQuery } from '../api/dashboardWidgetApi'
import { RefreshButton } from './RefreshButton'
import { formatNumber, formatPercent } from '../utils/format'

const failureColor = (rate: number): string => {
    if (rate >= 5) return 'var(--color-status-error-fg)'
    if (rate >= 1) return 'var(--color-status-warning-fg)'
    return 'var(--color-status-success-fg)'
}

const COLUMNS = '1.6fr 1fr 1fr'

export function TopConnectorsCard() {
    const { t, lang } = useI18n('dashboard')
    const { data, isLoading, isFetching, refetch } = useGetTopWorkflowsQuery()

    const rows = data?.rows ?? []

    return (
        <Card
            title={t('topConnectors.title')}
            extra={
                <RefreshButton
                    onClick={refetch}
                    loading={isFetching}
                    testId="dashboard-top-workflows-refresh"
                />
            }
        >
            {isLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
                    <Loading />
                </div>
            ) : rows.length === 0 ? (
                <Empty />
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: COLUMNS,
                            gap: 8,
                            padding: '6px 0',
                            borderBottom: '1px solid var(--color-border-subtle)',
                        }}
                    >
                        <Typography variant="caption" isSubtle isBold>
                            {t('topConnectors.name')}
                        </Typography>
                        <Typography variant="caption" isSubtle isBold>
                            {t('topConnectors.executions')}
                        </Typography>
                        <Typography variant="caption" isSubtle isBold>
                            {t('topConnectors.failureRate')}
                        </Typography>
                    </div>
                    {rows.map((row) => (
                        <div
                            key={row.connectionId}
                            style={{
                                display: 'grid',
                                gridTemplateColumns: COLUMNS,
                                gap: 8,
                                padding: '8px 0',
                                alignItems: 'center',
                            }}
                        >
                            <Typography variant="body" isBold>
                                {row.title}
                            </Typography>
                            <Typography variant="body">
                                {formatNumber(row.executions, lang)}
                            </Typography>
                            <span
                                style={{
                                    color: failureColor(row.failureRate),
                                    fontWeight: 500,
                                }}
                            >
                                {formatPercent(row.failureRate, lang)}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    )
}
