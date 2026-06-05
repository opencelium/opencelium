import { Card } from '@shared/ui/primitives/Card'
import { Typography } from '@shared/ui/primitives/Typography'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { MiniLineChart, type Series } from './MiniLineChart'
import { executionsChart } from '../dashboard.mock'

const EXECUTIONS_COLOR = 'var(--color-action-primary)'
const FAILURES_COLOR = 'var(--color-status-error-fg)'

export function ExecutionsChartCard() {
    const { t } = useI18n('dashboard')
    const series: Series[] = [
        {
            key: 'executions',
            color: EXECUTIONS_COLOR,
            points: executionsChart.executions,
        },
        {
            key: 'failures',
            color: FAILURES_COLOR,
            points: executionsChart.failures,
        },
    ]

    return (
        <Card title={t('executionsChart.title')}>
            <MiniLineChart series={series} />
            <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                <Legend color={EXECUTIONS_COLOR} label={t('executionsChart.executions')} />
                <Legend color={FAILURES_COLOR} label={t('executionsChart.failures')} />
            </div>
        </Card>
    )
}

function Legend({ color, label }: { color: string; label: string }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
                style={{
                    width: 10,
                    height: 10,
                    borderRadius: 10,
                    background: color,
                }}
            />
            <Typography variant="caption" isSubtle>
                {label}
            </Typography>
        </div>
    )
}
