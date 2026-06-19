import { Card } from '@shared/ui/primitives/Card'
import { useSystemMetrics } from '@widgets/SystemMetrics/socket/useSystemMetrics'
import { useSocket } from '@shared/api/socket/useSocket'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { RadialGauge } from './RadialGauge'
import { SocketStatusDot } from './SocketStatusDot'
import { formatKilobytes } from '../utils/format'
import './resourceUsageCard.css'

const BASE_COLOR = 'var(--color-action-secondary)'

// Shared gauge color: the base color below 60% usage, blending toward red as
// it climbs to 100% (fully red at the top).
const usageColor = (percent: number): string => {
    const clamped = Math.min(100, Math.max(0, percent))
    if (clamped <= 60) return BASE_COLOR
    const redMix = Math.round(((clamped - 60) / 40) * 100)
    return `color-mix(in srgb, var(--color-status-error-fg) ${redMix}%, ${BASE_COLOR})`
}

export function ResourceUsageCard() {
    const { t } = useI18n('dashboard')
    const { systemMetrics: metrics } = useSystemMetrics()
    const { status } = useSocket()

    const isConnecting = status === 'idle' || status === 'connecting'
    const isLoading = isConnecting || (status === 'connected' && !metrics)

    const noData = t('metrics.noData')

    const cpuText = metrics?.cpu_usage ? `${metrics.cpu_usage}%` : noData
    const cpuPercent = metrics?.cpu_usage ?? 0

    const memoryText = metrics?.memory_usage ? formatKilobytes(metrics.memory_usage) : noData
    const memoryPercent =
        metrics?.memory_usage && metrics?.max_memory_size
            ? (metrics.memory_usage / metrics.max_memory_size) * 100
            : 0

    return (
        <Card title={t('resourceUsage.title')} className="resource-usage-card" extra={<SocketStatusDot />}>
            <div
                style={{
                    display: 'flex',
                    gap: 16,
                    justifyContent: 'space-around',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    width: '100%',
                }}
            >
                <RadialGauge
                    percent={cpuPercent}
                    valueText={cpuText}
                    label={t('resourceUsage.cpu')}
                    color={usageColor(cpuPercent)}
                    loading={isLoading}
                />
                <RadialGauge
                    percent={memoryPercent}
                    valueText={memoryText}
                    label={t('resourceUsage.memory')}
                    color={usageColor(memoryPercent)}
                    loading={isLoading}
                />
            </div>
        </Card>
    )
}
