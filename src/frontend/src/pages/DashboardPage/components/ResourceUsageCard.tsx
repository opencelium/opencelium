import { Card } from '@shared/ui/primitives/Card'
import { useSystemMetrics } from '@widgets/SystemMetrics/socket/useSystemMetrics'
import { useSocket } from '@shared/api/socket/useSocket'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { RadialGauge } from './RadialGauge'
import { SocketStatusDot } from './SocketStatusDot'
import { formatKilobytes } from '../utils/format'
import './resourceUsageCard.css'

const CPU_COLOR = 'var(--color-action-secondary)'
const MEMORY_COLOR = 'var(--color-status-success-fg)'

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
                    color={CPU_COLOR}
                    loading={isLoading}
                />
                <RadialGauge
                    percent={memoryPercent}
                    valueText={memoryText}
                    label={t('resourceUsage.memory')}
                    color={MEMORY_COLOR}
                    loading={isLoading}
                />
            </div>
        </Card>
    )
}
