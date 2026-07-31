import React, { useMemo, useState } from 'react'
import { Typography } from '@shared/ui/primitives/Typography'
import {
    formatCompactNumber,
    formatNumber,
} from '@pages/SubscriptionPage/formatters'

export type DailyUsageDatum = { startDate: number; operationUsage: number }

type Props = {
    data: DailyUsageDatum[]
    lang: string
    emptyLabel?: string
}

type Point = { dayMs: number; value: number; label: string }

const PADDING = { top: 24, right: 24, bottom: 36, left: 56 }
const HEIGHT = 240
const Y_TICKS = 4
const MAX_X_LABELS = 6

const dayKey = (epoch: number) => {
    const d = new Date(epoch)
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

const bucketByDay = (data: DailyUsageDatum[]): Point[] => {
    const map = new Map<number, number>()
    data.forEach((d) => {
        const k = dayKey(d.startDate)
        map.set(k, (map.get(k) ?? 0) + d.operationUsage)
    })
    return [...map.entries()]
        .sort(([a], [b]) => a - b)
        .map(([dayMs, value]) => ({ dayMs, value, label: '' }))
}

const formatDayLabel = (epoch: number, lang: string) =>
    new Intl.DateTimeFormat(lang, { day: '2-digit', month: '2-digit' }).format(
        new Date(epoch),
    )

const formatFullDate = (epoch: number, lang: string) =>
    new Intl.DateTimeFormat(lang, {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(new Date(epoch))

export const DailyUsageChart: React.FC<Props> = ({ data, lang, emptyLabel }) => {
    const [width, setWidth] = useState(640)
    const containerRef = React.useRef<HTMLDivElement | null>(null)

    React.useEffect(() => {
        const el = containerRef.current
        if (!el) return
        const ro = new ResizeObserver(([entry]) => {
            setWidth(entry.contentRect.width)
        })
        ro.observe(el)
        setWidth(el.clientWidth)
        return () => ro.disconnect()
    }, [])

    const points = useMemo(() => bucketByDay(data), [data])

    if (points.length === 0) {
        return (
            <div ref={containerRef} style={{ padding: 24 }}>
                <Typography isSubtle>{emptyLabel ?? ''}</Typography>
            </div>
        )
    }

    const innerW = Math.max(width - PADDING.left - PADDING.right, 1)
    const innerH = HEIGHT - PADDING.top - PADDING.bottom

    const maxValue = Math.max(...points.map((p) => p.value), 1)
    const yMax = Math.ceil(maxValue * 1.1)

    const xFor = (i: number) =>
        PADDING.left +
        (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW)
    const yFor = (v: number) => PADDING.top + innerH - (v / yMax) * innerH

    const linePath = points
        .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i)} ${yFor(p.value)}`)
        .join(' ')

    const areaPath =
        `M ${xFor(0)} ${PADDING.top + innerH} ` +
        points
            .map((p, i) => `L ${xFor(i)} ${yFor(p.value)}`)
            .join(' ') +
        ` L ${xFor(points.length - 1)} ${PADDING.top + innerH} Z`

    const yTicks = Array.from({ length: Y_TICKS + 1 }, (_, i) => (yMax * i) / Y_TICKS)

    const xLabelStep = Math.max(1, Math.ceil(points.length / MAX_X_LABELS))

    return (
        <div ref={containerRef} style={{ width: '100%' }}>
            <svg
                width={width}
                height={HEIGHT}
                viewBox={`0 0 ${width} ${HEIGHT}`}
                style={{ display: 'block' }}
                role="img"
            >
                <defs>
                    <linearGradient id="usage-area" x1="0" x2="0" y1="0" y2="1">
                        <stop
                            offset="0%"
                            stopColor="var(--color-action-primary, #2563eb)"
                            stopOpacity="0.28"
                        />
                        <stop
                            offset="100%"
                            stopColor="var(--color-action-primary, #2563eb)"
                            stopOpacity="0"
                        />
                    </linearGradient>
                </defs>

                {yTicks.map((t, i) => {
                    const y = yFor(t)
                    return (
                        <g key={i}>
                            <line
                                x1={PADDING.left}
                                x2={width - PADDING.right}
                                y1={y}
                                y2={y}
                                stroke="var(--color-border-subtle, #e0e0e0)"
                                strokeDasharray={i === 0 ? undefined : '3 3'}
                            />
                            <text
                                x={PADDING.left - 8}
                                y={y}
                                textAnchor="end"
                                dominantBaseline="middle"
                                fontSize={11}
                                fill="var(--color-text-secondary, #666)"
                            >
                                {formatCompactNumber(t, lang)}
                            </text>
                        </g>
                    )
                })}

                <path
                    d={areaPath}
                    fill="url(#usage-area)"
                    stroke="none"
                />
                <path
                    d={linePath}
                    fill="none"
                    stroke="var(--color-action-primary, #2563eb)"
                    strokeWidth={2}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                />

                {points.map((p, i) => (
                    <g key={p.dayMs}>
                        <circle
                            cx={xFor(i)}
                            cy={yFor(p.value)}
                            r={3}
                            fill="var(--color-action-primary, #2563eb)"
                        />
                        <title>
                            {`${formatFullDate(p.dayMs, lang)}: ${formatNumber(p.value, lang)}`}
                        </title>
                    </g>
                ))}

                {points.map((p, i) => {
                    if (i % xLabelStep !== 0 && i !== points.length - 1) return null
                    return (
                        <text
                            key={`x-${p.dayMs}`}
                            x={xFor(i)}
                            y={HEIGHT - PADDING.bottom + 18}
                            textAnchor="middle"
                            fontSize={11}
                            fill="var(--color-text-secondary, #666)"
                        >
                            {formatDayLabel(p.dayMs, lang)}
                        </text>
                    )
                })}
            </svg>
        </div>
    )
}
