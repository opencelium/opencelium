import { Card } from '@shared/ui/primitives/Card'
import { Typography } from '@shared/ui/primitives/Typography'
import { Loading } from '@shared/ui/primitives/Loading/Loading'
import { Empty } from '@shared/ui/primitives/Empty'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { MiniLineChart, type Series } from './MiniLineChart'
import { RefreshButton } from './RefreshButton'
import {
    useGetExecutionsTimelineQuery,
    type DayOfWeek,
    type ExecutionsTimelinePoint,
} from '../api/dashboardWidgetApi'

const EXECUTIONS_COLOR = 'var(--color-action-primary)'
const FAILURES_COLOR = 'var(--color-status-error-fg)'

// Days after Sunday 2024-01-07, so a reference date lands on the right weekday
// regardless of how the backend serializes the `date` field.
const DAY_OFFSET: Record<DayOfWeek, number> = {
    SUNDAY: 0,
    MONDAY: 1,
    TUESDAY: 2,
    WEDNESDAY: 3,
    THURSDAY: 4,
    FRIDAY: 5,
    SATURDAY: 6,
}

const weekdayShort = (day: DayOfWeek, lang: string): string => {
    const reference = new Date(2024, 0, 7 + DAY_OFFSET[day])
    return new Intl.DateTimeFormat(lang, { weekday: 'short' }).format(reference)
}

const toSeries = (points: ExecutionsTimelinePoint[], lang: string): Series[] => {
    const labels = points.map((p) => weekdayShort(p.dayOfWeek, lang))
    return [
        {
            key: 'executions',
            color: EXECUTIONS_COLOR,
            points: points.map((p, i) => ({ label: labels[i], value: p.executions })),
        },
        {
            key: 'failures',
            color: FAILURES_COLOR,
            points: points.map((p, i) => ({ label: labels[i], value: p.failures })),
        },
    ]
}

export function ExecutionsChartCard() {
    const { t, lang } = useI18n('dashboard')
    const { data, isLoading, isFetching, refetch } = useGetExecutionsTimelineQuery()

    const points = data?.points ?? []

    return (
        <Card
            title={t('executionsChart.title')}
            extra={
                <RefreshButton
                    onClick={refetch}
                    loading={isFetching}
                    testId="dashboard-executions-refresh"
                />
            }
        >
            {isLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
                    <Loading />
                </div>
            ) : points.length === 0 ? (
                <Empty />
            ) : (
                <>
                    <MiniLineChart series={toSeries(points, lang)} />
                    <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                        <Legend color={EXECUTIONS_COLOR} label={t('executionsChart.executions')} />
                        <Legend color={FAILURES_COLOR} label={t('executionsChart.failures')} />
                    </div>
                </>
            )}
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
