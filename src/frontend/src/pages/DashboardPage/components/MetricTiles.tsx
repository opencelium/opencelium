import { useSystemMetrics } from '@widgets/SystemMetrics/socket/useSystemMetrics'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { MetricTile } from './MetricTile'
import { systemMetricsMock } from '../dashboard.mock'
import {
    formatBytes,
    formatDuration,
    formatNumber,
    formatPercent,
} from '../utils/format'

export function MetricTiles() {
    const { systemMetrics } = useSystemMetrics()
    const { t, lang } = useI18n('dashboard')

    const executions = systemMetrics?.executions ?? systemMetricsMock.executions
    const failureRate = systemMetrics?.failureRate ?? systemMetricsMock.failureRate
    const avgRuntimeMs = systemMetrics?.avgRuntimeMs ?? systemMetricsMock.avgRuntimeMs
    const runningJobs = systemMetrics?.runningJobs ?? systemMetricsMock.runningJobs
    const apiUsageBytes = systemMetrics?.apiUsageBytes ?? systemMetricsMock.apiUsageBytes
    const executionsDelta = systemMetrics?.executionsDelta ?? systemMetricsMock.executionsDelta
    const failureRateDelta = systemMetrics?.failureRateDelta ?? systemMetricsMock.failureRateDelta
    const avgRuntimeDelta = systemMetrics?.avgRuntimeDelta ?? systemMetricsMock.avgRuntimeDelta
    const runningJobsDelta = systemMetrics?.runningJobsDelta ?? systemMetricsMock.runningJobsDelta
    const apiUsageDelta = systemMetrics?.apiUsageDelta ?? systemMetricsMock.apiUsageDelta

    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 16,
            }}
        >
            <MetricTile
                tone="blue"
                icon="play"
                label={t('metrics.executions')}
                value={formatNumber(executions, lang)}
                delta={executionsDelta}
            />
            <MetricTile
                tone="red"
                icon="close"
                label={t('metrics.failureRate')}
                value={formatPercent(failureRate, lang)}
                delta={failureRateDelta}
            />
            <MetricTile
                tone="orange"
                icon="history"
                label={t('metrics.avgRuntime')}
                value={formatDuration(avgRuntimeMs)}
                delta={avgRuntimeDelta}
            />
            <MetricTile
                tone="violet"
                icon="user"
                label={t('metrics.runningJobs')}
                value={formatNumber(runningJobs, lang)}
                delta={runningJobsDelta}
            />
            <MetricTile
                tone="green"
                icon="download"
                label={t('metrics.apiUsage')}
                value={formatBytes(apiUsageBytes, lang)}
                delta={apiUsageDelta}
            />
        </div>
    )
}
