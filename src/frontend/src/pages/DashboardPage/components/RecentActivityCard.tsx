import { Card } from '@shared/ui/primitives/Card'
import { Icon } from '@shared/ui/primitives/Icon'
import { Typography } from '@shared/ui/primitives/Typography'
import { Button } from '@shared/ui/primitives/Button'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { recentActivity, type ActivityKind } from '../dashboard.mock'

const kindBg: Record<ActivityKind, string> = {
    success: 'rgba(22, 163, 74, 0.14)',
    failure: 'rgba(220, 38, 38, 0.12)',
    info: 'rgba(37, 99, 235, 0.12)',
    warning: 'rgba(234, 88, 12, 0.14)',
}

const kindFg: Record<ActivityKind, string> = {
    success: '#16a34a',
    failure: '#dc2626',
    info: '#2563eb',
    warning: '#ea580c',
}

export function RecentActivityCard() {
    const { t } = useI18n('dashboard')
    const items = recentActivity
    return (
        <Card
            title={t('recentActivity.title')}
            extra={<Button type="link">{t('recentActivity.viewAll')}</Button>}
        >
            {items.length === 0 ? (
                <Typography isSubtle>{t('recentActivity.empty')}</Typography>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {items.map((item) => (
                        <div
                            key={item.id}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                            }}
                        >
                            <div
                                style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: 8,
                                    background: kindBg[item.kind],
                                    color: kindFg[item.kind],
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                }}
                            >
                                <Icon name={item.icon} size={16} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <Typography variant="body" isBold>
                                    {item.title}
                                </Typography>
                                <div>
                                    <Typography variant="caption" isSubtle>
                                        {item.subtitle}
                                    </Typography>
                                </div>
                            </div>
                            <Typography variant="caption" isSubtle>
                                {item.timeAgo}
                            </Typography>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    )
}
