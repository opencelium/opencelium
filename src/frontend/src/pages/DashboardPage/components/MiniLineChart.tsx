import { useEffect, useMemo, useRef, useState } from 'react'

export type Series = {
    key: string
    color: string
    points: { label: string; value: number }[]
}

type Props = {
    series: Series[]
    height?: number
    yFormat?: (value: number) => string
}

const PADDING = { top: 16, right: 12, bottom: 28, left: 40 }
const Y_TICKS = 4

export function MiniLineChart({ series, height = 220, yFormat }: Props) {
    const containerRef = useRef<HTMLDivElement | null>(null)
    const [width, setWidth] = useState(480)

    useEffect(() => {
        const el = containerRef.current
        if (!el) return
        const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
        ro.observe(el)
        setWidth(el.clientWidth)
        return () => ro.disconnect()
    }, [])

    const { labels, maxValue } = useMemo(() => {
        const lbls = series[0]?.points.map((p) => p.label) ?? []
        const values = series.flatMap((s) => s.points.map((p) => p.value))
        const max = Math.max(...values, 1)
        return { labels: lbls, maxValue: Math.ceil(max * 1.1) }
    }, [series])

    const innerW = Math.max(width - PADDING.left - PADDING.right, 1)
    const innerH = height - PADDING.top - PADDING.bottom

    const xFor = (i: number, total: number) =>
        PADDING.left + (total <= 1 ? innerW / 2 : (i / (total - 1)) * innerW)
    const yFor = (v: number) => PADDING.top + innerH - (v / maxValue) * innerH

    const yTicks = Array.from({ length: Y_TICKS + 1 }, (_, i) => (maxValue * i) / Y_TICKS)

    return (
        <div ref={containerRef} style={{ width: '100%' }}>
            <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                {yTicks.map((tick, i) => {
                    const y = yFor(tick)
                    return (
                        <g key={i}>
                            <line
                                x1={PADDING.left}
                                x2={width - PADDING.right}
                                y1={y}
                                y2={y}
                                stroke="#e5e7eb"
                                strokeDasharray={i === 0 ? undefined : '3 3'}
                            />
                            <text
                                x={PADDING.left - 6}
                                y={y}
                                textAnchor="end"
                                dominantBaseline="middle"
                                fontSize={10}
                                fill="#6b7280"
                            >
                                {yFormat ? yFormat(tick) : Math.round(tick)}
                            </text>
                        </g>
                    )
                })}

                {series.map((s) => {
                    const path = s.points
                        .map(
                            (p, i) =>
                                `${i === 0 ? 'M' : 'L'} ${xFor(i, s.points.length)} ${yFor(p.value)}`,
                        )
                        .join(' ')
                    return (
                        <g key={s.key}>
                            <path
                                d={path}
                                fill="none"
                                stroke={s.color}
                                strokeWidth={2}
                                strokeLinejoin="round"
                                strokeLinecap="round"
                            />
                            {s.points.map((p, i) => (
                                <circle
                                    key={i}
                                    cx={xFor(i, s.points.length)}
                                    cy={yFor(p.value)}
                                    r={2.5}
                                    fill={s.color}
                                />
                            ))}
                        </g>
                    )
                })}

                {labels.map((label, i) => (
                    <text
                        key={`${label}-${i}`}
                        x={xFor(i, labels.length)}
                        y={height - PADDING.bottom + 16}
                        textAnchor="middle"
                        fontSize={10}
                        fill="#6b7280"
                    >
                        {label}
                    </text>
                ))}
            </svg>
        </div>
    )
}
