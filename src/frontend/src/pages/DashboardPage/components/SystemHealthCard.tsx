import { useMemo } from 'react'
import { Card } from '@shared/ui/primitives/Card'
import { Typography } from '@shared/ui/primitives/Typography'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { systemHealth, type HealthSlice } from '../dashboard.mock'

const sliceColor: Record<HealthSlice['key'], string> = {
    healthy: '#16a34a',
    warning: '#ea580c',
    critical: '#dc2626',
}

const SIZE = 140
const STROKE = 14
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export function SystemHealthCard() {
    const { t } = useI18n('dashboard')
    const total = useMemo(
        () => systemHealth.reduce((sum, slice) => sum + slice.value, 0),
        [],
    )

    const segments = useMemo(() => {
        const lengths = systemHealth.map(
            (slice) => (total === 0 ? 0 : slice.value / total) * CIRCUMFERENCE,
        )
        const offsets = lengths.reduce<number[]>((acc, length, index) => {
            const previous = index === 0 ? 0 : acc[index - 1] + lengths[index - 1]
            acc.push(previous)
            return acc
        }, [])
        return systemHealth.map((slice, index) => ({
            key: slice.key,
            color: sliceColor[slice.key],
            dasharray: `${lengths[index]} ${CIRCUMFERENCE - lengths[index]}`,
            dashoffset: -offsets[index],
        }))
    }, [total])

    const healthyPercent = total === 0 ? 0 : Math.round((systemHealth[0].value / total) * 100)

    return (
        <Card title={t('systemHealth.title')}>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 24,
                }}
            >
                <div style={{ position: 'relative', width: SIZE, height: SIZE }}>
                    <svg width={SIZE} height={SIZE}>
                        <circle
                            cx={SIZE / 2}
                            cy={SIZE / 2}
                            r={RADIUS}
                            fill="none"
                            stroke="#eef0f3"
                            strokeWidth={STROKE}
                        />
                        {segments.map((segment) => (
                            <circle
                                key={segment.key}
                                cx={SIZE / 2}
                                cy={SIZE / 2}
                                r={RADIUS}
                                fill="none"
                                stroke={segment.color}
                                strokeWidth={STROKE}
                                strokeDasharray={segment.dasharray}
                                strokeDashoffset={segment.dashoffset}
                                transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
                                strokeLinecap="butt"
                            />
                        ))}
                    </svg>
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Typography variant="title" isBold>
                            {healthyPercent}%
                        </Typography>
                        <Typography variant="caption" isSubtle>
                            {t('systemHealth.statusHealthy')}
                        </Typography>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                    {systemHealth.map((slice) => (
                        <div
                            key={slice.key}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                justifyContent: 'space-between',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span
                                    style={{
                                        width: 10,
                                        height: 10,
                                        borderRadius: 10,
                                        background: sliceColor[slice.key],
                                    }}
                                />
                                <Typography variant="body">
                                    {t(`systemHealth.${slice.key}` as const)}
                                </Typography>
                            </div>
                            <Typography variant="body" isBold>
                                {slice.value}%
                            </Typography>
                        </div>
                    ))}
                </div>
            </div>
        </Card>
    )
}
