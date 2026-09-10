import { useEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode } from 'react'
import { ChartTooltip } from './ChartTooltip'

export type Series = {
    key: string
    color: string
    points: { label: string; value: number }[]
}

type Props = {
    series: Series[]
    height?: number
    yFormat?: (value: number) => string
    /** Hover tooltip content for the point at `index`; omit to disable hovering. */
    renderTooltip?: (index: number) => ReactNode
    testId?: string
}

const PADDING = { top: 16, right: 12, bottom: 28, left: 40 }
const Y_TICKS = 4

export function MiniLineChart({ series, height = 220, yFormat, renderTooltip, testId }: Props) {
    const containerRef = useRef<HTMLDivElement | null>(null)
    const [width, setWidth] = useState(480)
    const [hoverIndex, setHoverIndex] = useState<number | null>(null)

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

    const isHoverable = Boolean(renderTooltip) && labels.length > 0

    const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
        if (!isHoverable) return
        const relativeX = event.clientX - event.currentTarget.getBoundingClientRect().left
        const step = labels.length <= 1 ? innerW : innerW / (labels.length - 1)
        const nearest = Math.round((relativeX - PADDING.left) / step)
        setHoverIndex(Math.min(labels.length - 1, Math.max(0, nearest)))
    }

    const activeIndex = isHoverable ? hoverIndex : null
    const activePoints =
        activeIndex === null
            ? []
            : series
                  .map((s) => ({ series: s, point: s.points[activeIndex] }))
                  .filter((entry) => entry.point !== undefined)

    return (
        <div
            ref={containerRef}
            style={{ width: '100%', position: 'relative' }}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoverIndex(null)}
        >
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
                                style={{ stroke: 'var(--color-border-subtle)' }}
                                strokeDasharray={i === 0 ? undefined : '3 3'}
                            />
                            <text
                                x={PADDING.left - 6}
                                y={y}
                                textAnchor="end"
                                dominantBaseline="middle"
                                fontSize={10}
                                style={{ fill: 'var(--color-text-secondary)' }}
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
                                style={{ stroke: s.color }}
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
                                    style={{ fill: s.color }}
                                />
                            ))}
                        </g>
                    )
                })}

                {activeIndex !== null && (
                    <g pointerEvents="none">
                        <line
                            x1={xFor(activeIndex, labels.length)}
                            x2={xFor(activeIndex, labels.length)}
                            y1={PADDING.top}
                            y2={PADDING.top + innerH}
                            style={{ stroke: 'var(--color-border-strong)' }}
                            strokeDasharray="3 3"
                        />
                        {activePoints.map(({ series: s, point }) => (
                            <circle
                                key={s.key}
                                cx={xFor(activeIndex, labels.length)}
                                cy={yFor(point.value)}
                                r={4.5}
                                style={{
                                    fill: s.color,
                                    stroke: 'var(--color-background-surface)',
                                }}
                                strokeWidth={2}
                            />
                        ))}
                    </g>
                )}

                {labels.map((label, i) => (
                    <text
                        key={`${label}-${i}`}
                        x={xFor(i, labels.length)}
                        y={height - PADDING.bottom + 16}
                        textAnchor="middle"
                        fontSize={10}
                        style={{ fill: 'var(--color-text-secondary)' }}
                    >
                        {label}
                    </text>
                ))}
            </svg>

            {activeIndex !== null && activePoints.length > 0 && (
                <ChartTooltip
                    x={xFor(activeIndex, labels.length)}
                    y={Math.min(...activePoints.map(({ point }) => yFor(point.value)))}
                    containerWidth={width}
                    testId={testId ? `${testId}-tooltip` : undefined}
                >
                    {renderTooltip?.(activeIndex)}
                </ChartTooltip>
            )}
        </div>
    )
}
