import type { ReactNode } from 'react'
import { Card } from '@shared/ui/primitives/Card'
import { Icon } from '@shared/ui/primitives/Icon'
import type { IconName } from '@shared/ui/primitives/Icon/Icon.types'
import { Typography } from '@shared/ui/primitives/Typography'
import { Loading } from '@shared/ui/primitives/Loading/Loading'

type Tone = 'blue' | 'red' | 'orange' | 'violet' | 'green'

type Props = {
    label: ReactNode
    value: ReactNode
    icon: IconName
    tone: Tone
    loading?: boolean
    cornerSlot?: ReactNode
}

const toneToBg: Record<Tone, string> = {
    blue: 'var(--color-status-info-bg)',
    red: 'var(--color-status-error-bg)',
    orange: 'var(--color-status-warning-bg)',
    violet: 'var(--color-action-primary-subtle)',
    green: 'var(--color-status-success-bg)',
}

const toneToFg: Record<Tone, string> = {
    blue: 'var(--color-status-info-fg)',
    red: 'var(--color-status-error-fg)',
    orange: 'var(--color-status-warning-fg)',
    violet: 'var(--color-action-secondary)',
    green: 'var(--color-status-success-fg)',
}

export function MetricTile({ label, value, icon, tone, loading, cornerSlot }: Props) {
    return (
        <Card>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12 }}>
                {cornerSlot && (
                    <span style={{ position: 'absolute', top: 0, right: 0 }}>{cornerSlot}</span>
                )}
                <div
                    style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: toneToBg[tone],
                        color: toneToFg[tone],
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                    }}
                >
                    <Icon name={icon} size={22} />
                </div>
                <div style={{ minWidth: 0 }}>
                    <Typography variant="caption" isSubtle>
                        {label}
                    </Typography>
                    <div style={{ marginTop: 2 }}>
                        {loading ? (
                            <Loading inline size="sm" />
                        ) : (
                            <Typography variant="title" isBold>
                                {value}
                            </Typography>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    )
}
