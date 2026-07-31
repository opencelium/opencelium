import { Card } from '@shared/ui/primitives/Card'
import { Icon } from '@shared/ui/primitives/Icon'
import { Typography } from '@shared/ui/primitives/Typography'
import { Button } from '@shared/ui/primitives/Button'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { recentActivity, type ActivityKind } from '../dashboard.mock'

const kindBg: Record<ActivityKind, string> = {
    success: 'var(--color-status-success-bg)',
    failure: 'var(--color-status-error-bg)',
    info: 'var(--color-status-info-bg)',
    warning: 'var(--color-status-warning-bg)',
}

const kindFg: Record<ActivityKind, string> = {
    success: 'var(--color-status-success-fg)',
    failure: 'var(--color-status-error-fg)',
    info: 'var(--color-status-info-fg)',
    warning: 'var(--color-status-warning-fg)',
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
