import React from 'react'
import { formatCompactNumber } from '@pages/SubscriptionPage/formatters'

const DIVISIONS = 10

export const UsageBar: React.FC<{ used: number; total: number; lang: string }> = ({
    used,
    total,
    lang,
}) => {
    const safeTotal = total > 0 ? total : 1
    const ratio = Math.max(0, Math.min(used / safeTotal, 1))
    const percent = `${ratio * 100}%`
    const ticks = Array.from({ length: DIVISIONS + 1 }, (_, i) => i)
    return (
        <div style={{ marginTop: 32 }}>
            <div
                style={{
                    position: 'relative',
                    height: 24,
                    borderRadius: 6,
                    background: 'var(--color-border-subtle, #e0e0e0)',
                    overflow: 'visible',
                }}
            >
                <div
                    style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: percent,
                        background: 'var(--color-action-primary, #1677ff)',
                        transition: 'width 0.3s ease',
                        borderRadius: 6,
                    }}
                />
                {ticks.slice(1, -1).map((i) => (
                    <div
                        key={i}
                        style={{
                            position: 'absolute',
                            top: 4,
                            bottom: 4,
                            left: `${(i / DIVISIONS) * 100}%`,
                            width: 1,
                            background: 'var(--color-border-strong, rgba(0,0,0,0.28))',
                            pointerEvents: 'none',
                        }}
                    />
                ))}
                <div
                    style={{
                        position: 'absolute',
                        top: -26,
                        left: percent,
                        transform: 'translateX(-50%)',
                        background: 'var(--color-action-primary, #1677ff)',
                        color: 'var(--color-text-on-action)',
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: 12,
                        whiteSpace: 'nowrap',
                    }}
                >
                    {formatCompactNumber(used, lang)}
                </div>
            </div>
            <div
                style={{
                    position: 'relative',
                    height: 18,
                    marginTop: 6,
                    fontSize: 12,
                    color: 'var(--color-text-secondary, #666)',
                }}
            >
                {ticks.map((i) => {
                    const value = (safeTotal * i) / DIVISIONS
                    const isEdge = i === 0 || i === DIVISIONS
                    return (
                        <span
                            key={i}
                            style={{
                                position: 'absolute',
                                left: `${(i / DIVISIONS) * 100}%`,
                                transform:
                                    i === 0
                                        ? 'translateX(0)'
                                        : i === DIVISIONS
                                          ? 'translateX(-100%)'
                                          : 'translateX(-50%)',
                                whiteSpace: 'nowrap',
                                fontWeight: isEdge ? 500 : 400,
                            }}
                        >
                            {i === 0 ? '0' : formatCompactNumber(value, lang)}
                        </span>
                    )
                })}
            </div>
        </div>
    )
}
