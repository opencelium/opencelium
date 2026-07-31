import { useSystemMetrics } from '@widgets/SystemMetrics/socket/useSystemMetrics'
import { useSocket } from '@shared/api/socket/useSocket'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { MetricTile } from './MetricTile'
import { SocketStatusDot } from './SocketStatusDot'
import {
    calculateClampedPercentage,
    formatDuration,
    formatKilobytes,
    formatNumber,
} from '../utils/format'

export function MetricTiles() {
    const { systemMetrics: metrics } = useSystemMetrics()
    const { status } = useSocket()
    const { t, lang } = useI18n('dashboard')

    // The socket is still establishing (or connected but the first metrics
    // payload hasn't arrived yet) — show spinners instead of empty dashes.
    const isConnecting = status === 'idle' || status === 'connecting'
    const isLoading = isConnecting || (status === 'connected' && !metrics)

    const noData = t('metrics.noData')

    const executions = metrics?.total_execs ? formatNumber(metrics.total_execs, lang) : noData

    const failureRate =
        metrics?.total_failed_execs && metrics?.total_execs
            ? `${calculateClampedPercentage(metrics.total_execs, metrics.total_failed_execs)}%`
            : noData

    const avgRuntime = metrics?.average_runtime_s ? formatDuration(metrics.average_runtime_s) : noData

    const runtime = metrics?.total_runtime ? formatDuration(metrics.total_runtime) : noData

    const logs = metrics?.exec_log_size ? formatKilobytes(metrics.exec_log_size) : noData

    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 16,
            }}
        >
            <MetricTile tone="blue" icon="play" label={t('metrics.executions')} value={executions} loading={isLoading} cornerSlot={<SocketStatusDot />} />
            <MetricTile tone="red" icon="close" label={t('metrics.failureRate')} value={failureRate} loading={isLoading} cornerSlot={<SocketStatusDot />} />
            <MetricTile tone="orange" icon="history" label={t('metrics.avgRuntime')} value={avgRuntime} loading={isLoading} cornerSlot={<SocketStatusDot />} />
            <MetricTile
                tone="violet"
                icon="history"
                label={t('metrics.runtime')}
                value={runtime}
                loading={isLoading}
                cornerSlot={<SocketStatusDot />}
            />
            <MetricTile tone="green" icon="download" label={t('metrics.logs')} value={logs} loading={isLoading} cornerSlot={<SocketStatusDot />} />
        </div>
    )
}
