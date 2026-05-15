import { Card } from '@shared/ui/primitives/Card'
import { Typography } from '@shared/ui/primitives/Typography'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { topConnectors } from '../dashboard.mock'
import { formatNumber, formatPercent } from '../utils/format'

const failureColor = (rate: number): string => {
    if (rate >= 5) return '#dc2626'
    if (rate >= 1) return '#ea580c'
    return '#16a34a'
}

export function TopConnectorsCard() {
    const { t, lang } = useI18n('dashboard')

    return (
        <Card title={t('topConnectors.title')}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '1.6fr 1fr 1fr',
                        gap: 8,
                        padding: '6px 0',
                        borderBottom: '1px solid #eef0f3',
                    }}
                >
                    <Typography variant="caption" isSubtle isBold>
                        {t('topConnectors.name')}
                    </Typography>
                    <Typography variant="caption" isSubtle isBold>
                        {t('topConnectors.executions')}
                    </Typography>
                    <Typography variant="caption" isSubtle isBold>
                        {t('topConnectors.failureRate')}
                    </Typography>
                </div>
                {topConnectors.map((connector) => (
                    <div
                        key={connector.id}
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '1.6fr 1fr 1fr',
                            gap: 8,
                            padding: '8px 0',
                            alignItems: 'center',
                        }}
                    >
                        <Typography variant="body" isBold>
                            {connector.name}
                        </Typography>
                        <Typography variant="body">
                            {formatNumber(connector.executions, lang)}
                        </Typography>
                        <span
                            style={{
                                color: failureColor(connector.failureRate),
                                fontWeight: 500,
                            }}
                        >
                            {formatPercent(connector.failureRate, lang)}
                        </span>
                    </div>
                ))}
            </div>
        </Card>
    )
}
