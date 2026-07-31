import { Card } from '@shared/ui/primitives/Card'
import { Typography } from '@shared/ui/primitives/Typography'
import { Button } from '@shared/ui/primitives/Button'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { attentionItems, type AttentionSeverity } from '../dashboard.mock'

const severityColor: Record<AttentionSeverity, string> = {
    critical: 'var(--color-status-error-fg)',
    warning: 'var(--color-status-warning-fg)',
    info: 'var(--color-status-info-fg)',
}

const severityBg: Record<AttentionSeverity, string> = {
    critical: 'var(--color-status-error-bg)',
    warning: 'var(--color-status-warning-bg)',
    info: 'var(--color-status-info-bg)',
}

export function AttentionRequiredCard() {
    const { t } = useI18n('dashboard')
    const items = attentionItems
    return (
        <Card
            title={t('attention.title')}
            extra={<Button type="link">{t('attention.viewAll')}</Button>}
        >
            {items.length === 0 ? (
                <Typography isSubtle>{t('attention.empty')}</Typography>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {items.map((item) => (
                        <div
                            key={item.id}
                            style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 12,
                            }}
                        >
                            <span
                                style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: 8,
                                    background: severityColor[item.severity],
                                    marginTop: 8,
                                    flexShrink: 0,
                                    boxShadow: `0 0 0 4px ${severityBg[item.severity]}`,
                                }}
                            />
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
