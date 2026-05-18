import type { ReactNode } from 'react'
import { Card } from '@shared/ui/primitives/Card'
import { Typography } from '@shared/ui/primitives/Typography'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { MiniLineChart, type Series } from './MiniLineChart'
import { resourceUsage, type ResourceSeries } from '../dashboard.mock'
import { formatBytes, formatPercent } from '../utils/format'

const CPU_COLOR = '#7c3aed'
const MEMORY_COLOR = '#16a34a'

export function ResourceUsageCard() {
    const { t, lang } = useI18n('dashboard')

    return (
        <Card title={t('resourceUsage.title')}>
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 16,
                }}
            >
                <Sparkline
                    label={t('resourceUsage.cpu')}
                    valueText={formatPercent(resourceUsage.cpu.current, lang, 2)}
                    color={CPU_COLOR}
                    series={resourceUsage.cpu}
                />
                <Sparkline
                    label={t('resourceUsage.memory')}
                    valueText={formatBytes(resourceUsage.memory.current, lang)}
                    color={MEMORY_COLOR}
                    series={resourceUsage.memory}
                />
            </div>
        </Card>
    )
}

type SparklineProps = {
    label: ReactNode
    valueText: ReactNode
    color: string
    series: ResourceSeries
}

function Sparkline({ label, valueText, color, series }: SparklineProps) {
    const data: Series[] = [
        {
            key: 'value',
            color,
            points: series.points,
        },
    ]
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Typography variant="caption" isSubtle>
                {label}
            </Typography>
            <Typography variant="title" isBold>
                {valueText}
            </Typography>
            <MiniLineChart series={data} height={140} />
        </div>
    )
}
