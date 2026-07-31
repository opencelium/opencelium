import React from 'react'
import {Loading} from "@shared/ui/primitives/Loading/Loading.tsx";
import { Typography } from '@shared/ui/primitives/Typography'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { useGetActiveSubscriptionQuery } from '@entities/subscription/api/subscriptionApi'
import {
    formatCompactNumber,
    formatDate,
    formatPeriod,
} from '@pages/SubscriptionPage/formatters'
import { UsageBar } from '@pages/SubscriptionPage/UsageBar'
import { LicenseActionsPanel } from '@pages/SubscriptionPage/license-actions/LicenseActionsPanel'

const rowGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'minmax(220px, max-content) 1fr',
    columnGap: 24,
    rowGap: 12,
    alignItems: 'baseline',
}

const valueWrap: React.CSSProperties = { textAlign: 'right' }

export const LicenseInformationStep: React.FC = () => {
    const { t, lang } = useI18n('entities')
    const { data, isLoading } = useGetActiveSubscriptionQuery()

    if (isLoading)
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
            <LicenseActionsPanel />

            {!data ? (
                <Typography>
                    {t('subscription.manage.noSubscription' as never)}
                </Typography>
            ) : (
                <>
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
                                    <Typography>
                                        {formatCompactNumber(data.extraOps, lang)}
                                    </Typography>
                                </div>
                            </>
                        )}
                    </div>

                    <UsageBar
                        used={data.currentOperationUsage}
                        total={data.totalOperationUsage}
                        lang={lang}
                    />
                </>
            )}
        </div>
    )
}
