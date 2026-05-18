import React from 'react'
import {Loading} from "@shared/ui/primitives/Loading/Loading.tsx";
import { Typography } from '@shared/ui/primitives/Typography'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { useGetActiveSubscriptionQuery } from '@entities/subscription/api/subscriptionApi'
import {
    formatCompactNumber,
    formatDate,
    formatNumber,
    formatPeriod,
} from '@pages/SubscriptionPage/formatters'

const rowGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'minmax(220px, max-content) 1fr',
    columnGap: 24,
    rowGap: 12,
    alignItems: 'baseline',
}

const valueWrap: React.CSSProperties = { textAlign: 'right' }

const DIVISIONS = 10

const UsageBar: React.FC<{ used: number; total: number; lang: string }> = ({
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
                        color: '#fff',
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

export const LicenseInformationStep: React.FC = () => {
    const { t, lang } = useI18n('entities')
    const { data, isLoading } = useGetActiveSubscriptionQuery()

    if (isLoading || !data)
        return (
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: 300,
                }}
            >
                <Loading />
            </div>
        )

    return (
        <div>
            <div style={rowGridStyle}>
                <Typography isBold>
                    {t('subscription.license.status' as never)}:
                </Typography>
                <div style={valueWrap}>
                    <Typography>
                        {data.active
                            ? t('subscription.license.valid' as never)
                            : t('subscription.license.invalid' as never)}
                    </Typography>
                </div>

                <Typography isBold>
                    {t('subscription.license.type' as never)}:
                </Typography>
                <div style={valueWrap}>
                    <Typography>{data.type}</Typography>
                </div>

                <Typography isBold>
                    {t('subscription.license.totalOperations' as never)}:
                </Typography>
                <div style={valueWrap}>
                    <Typography>
                        {formatCompactNumber(data.totalOperationUsage, lang)}
                    </Typography>
                </div>

                <Typography isBold>
                    {t('subscription.license.expirationDate' as never)}:
                </Typography>
                <div style={valueWrap}>
                    <Typography>
                        {data.endDate
                            ? formatDate(data.endDate, lang)
                            : t('subscription.license.infinite' as never)}
                    </Typography>
                </div>

                <Typography isBold>
                    {t('subscription.license.monthlyPeriod' as never)}:
                </Typography>
                <div style={valueWrap}>
                    <Typography>
                        {formatPeriod(
                            data.monthPeriod.startDate,
                            data.monthPeriod.endDate,
                            lang,
                        )}
                    </Typography>
                </div>

                {data.extraOps != null && (
                    <>
                        <Typography isBold>
                            {t('subscription.license.extraOps' as never)}:
                        </Typography>
                        <div style={valueWrap}>
                            <Typography>{formatCompactNumber(data.extraOps, lang)}</Typography>
                        </div>
                    </>
                )}
            </div>

            <UsageBar
                used={data.currentOperationUsage}
                total={data.totalOperationUsage}
                lang={lang}
            />
        </div>
    )
}
