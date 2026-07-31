import React, { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Alert } from '@shared/ui/primitives/Alert'
import { Button } from '@shared/ui/primitives/Button'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { useAppDispatch } from '@shared/lib/storeHooks'
import { baseApi } from '@shared/api/baseApi'
import { SUBSCRIPTION_TAG } from '@entities/subscription/api/subscription.tags'
import { useCurrentSubscription } from '@entities/subscription/socket/useCurrentSubscription'
import { useSubscriptionIssue } from '@entities/subscription/model/useSubscriptionIssue'

export const SubscriptionAlert: React.FC = () => {
    const { t } = useI18n('entities')
    const navigate = useNavigate()
    const location = useLocation()
    const dispatch = useAppDispatch()
    const { issue } = useSubscriptionIssue()
    const { currentSubscription: socketSubscription } = useCurrentSubscription()

    // The banner mounts once per session; socket pushes signal that the
    // subscription changed server-side (e.g. ops limit reached mid-run).
    useEffect(() => {
        if (socketSubscription) {
            dispatch(baseApi.util.invalidateTags([{ type: SUBSCRIPTION_TAG, id: 'ACTIVE' }]))
        }
    }, [socketSubscription, dispatch])

    if (!issue) return null

    const isOnLicensePage = location.pathname === '/license'

    return (
        <Alert
            type={issue === 'noSubscription' ? 'warning' : 'error'}
            showIcon
            message={t(`subscription.banner.${issue}` as never)}
            action={
                isOnLicensePage ? undefined : (
                    <Button type="link" onClick={() => navigate('/license')}>
                        {t('subscription.banner.link' as never)}
                    </Button>
                )
            }
            style={{ borderRadius: 0 }}
        />
    )
}
