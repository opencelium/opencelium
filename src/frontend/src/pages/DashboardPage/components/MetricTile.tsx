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
    blue: 'rgba(37, 99, 235, 0.12)',
    red: 'rgba(220, 38, 38, 0.12)',
    orange: 'rgba(234, 88, 12, 0.14)',
    violet: 'rgba(124, 58, 237, 0.14)',
    green: 'rgba(22, 163, 74, 0.14)',
}

const toneToFg: Record<Tone, string> = {
    blue: '#2563eb',
    red: '#dc2626',
    orange: '#ea580c',
    violet: '#7c3aed',
    green: '#16a34a',
}

export function MetricTile({ label, value, icon, tone, delta }: Props) {
    const { t, lang } = useI18n('dashboard')
    const deltaColor =
        delta === undefined ? undefined : delta >= 0 ? '#16a34a' : '#dc2626'
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
                                <span style={{ color: '#888' }}>
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
