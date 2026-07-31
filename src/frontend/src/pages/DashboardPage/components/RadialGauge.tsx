import type { ReactNode } from 'react'
import { Typography } from '@shared/ui/primitives/Typography'
import { Loading } from '@shared/ui/primitives/Loading/Loading'

const SIZE = 140
const STROKE = 14
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

type Props = {
    percent: number
    valueText: ReactNode
    label: ReactNode
    color: string
    loading?: boolean
}

export function RadialGauge({ percent, valueText, label, color, loading }: Props) {
    const clamped = Math.min(100, Math.max(0, percent))
    const arc = (clamped / 100) * CIRCUMFERENCE

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
            }}
        >
            <div style={{ position: 'relative', width: SIZE, height: SIZE }}>
                <svg width={SIZE} height={SIZE}>
                    <circle
                        cx={SIZE / 2}
                        cy={SIZE / 2}
                        r={RADIUS}
                        fill="none"
                        style={{ stroke: 'var(--color-border-subtle)' }}
                        strokeWidth={STROKE}
                    />
                    {!loading && (
                        <circle
                            cx={SIZE / 2}
                            cy={SIZE / 2}
                            r={RADIUS}
                            fill="none"
                            style={{ stroke: color }}
                            strokeWidth={STROKE}
                            strokeDasharray={`${arc} ${CIRCUMFERENCE - arc}`}
                            strokeDashoffset={0}
                            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
                            strokeLinecap="round"
                        />
                    )}
                </svg>
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    {loading ? (
                        <Loading inline size="sm" />
                    ) : (
                        <Typography variant="title" isBold>
                            {valueText}
                        </Typography>
                    )}
                </div>
            </div>
            <Typography variant="caption" isSubtle>
                {label}
            </Typography>
        </div>
    )
}
