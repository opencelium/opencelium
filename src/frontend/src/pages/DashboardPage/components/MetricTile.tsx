import type { ReactNode } from 'react'
import { Card } from '@shared/ui/primitives/Card'
import { Icon } from '@shared/ui/primitives/Icon'
import type { IconName } from '@shared/ui/primitives/Icon/Icon.types'
import { Typography } from '@shared/ui/primitives/Typography'
import { useI18n } from '@shared/i18n/hooks/useI18n'

type Tone = 'blue' | 'red' | 'orange' | 'violet' | 'green'

type Props = {
    label: ReactNode
    value: ReactNode
    icon: IconName
    tone: Tone
    delta?: number
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

export function MetricTile({ label, value, icon, tone, delta }: Props) {
    const { t, lang } = useI18n('dashboard')
    const deltaColor =
        delta === undefined
            ? undefined
            : delta >= 0
              ? 'var(--color-status-success-fg)'
              : 'var(--color-status-error-fg)'
    const deltaFormatted =
        delta === undefined
            ? null
            : `${delta > 0 ? '+' : ''}${new Intl.NumberFormat(lang, {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
              }).format(delta)}%`

    return (
        <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
                        <Typography variant="title" isBold>
                            {value}
                        </Typography>
                    </div>
                    {deltaFormatted !== null && (
                        <div style={{ marginTop: 2 }}>
                            <Typography variant="caption">
                                <span style={{ color: deltaColor, fontWeight: 500 }}>
                                    {deltaFormatted}
                                </span>{' '}
                                <span style={{ color: 'var(--color-text-secondary)' }}>
                                    {t('delta.vsPrevious')}
                                </span>
                            </Typography>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    )
}
