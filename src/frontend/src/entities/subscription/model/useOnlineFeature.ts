import { useMemo } from 'react'
import { useOnlineStatus } from '@shared/network/useOnlineStatus'
import { useCheckServicePortalConnectionQuery } from '@entities/subscription/api/subscriptionApi'
import {
    useOnlineSyncStatus,
    type OnlineSyncScope,
} from '@entities/subscription/model/useOnlineSyncStatus'

export type OnlineFeatureBlockReason = 'offline' | 'syncDisabled' | 'portalUnreachable'

export type OnlineFeatureAvailability =
    | { state: 'checking' }
    | { state: 'available' }
    | { state: 'unavailable'; reason: OnlineFeatureBlockReason }

/** Leaf keys of the `common` namespace — pair with `CommonText` or `useI18n('common')`. */
export const ONLINE_FEATURE_REASON_KEY = {
    offline: 'onlineFeature.offline',
    syncDisabled: 'onlineFeature.syncDisabled',
    portalUnreachable: 'onlineFeature.portalUnreachable',
} as const satisfies Record<OnlineFeatureBlockReason, string>

/**
 * The gate for anything that syncs with, or fetches from, another server. Browser
 * connectivity is checked first: while the tab is offline the sync-status query cannot
 * answer either, so `offline` is the honest reason even before the config is known.
 */
export function useOnlineFeature(scope?: OnlineSyncScope): OnlineFeatureAvailability {
    const isOnline = useOnlineStatus()
    const { isActive, isLoading } = useOnlineSyncStatus(scope)

    return useMemo(() => {
        if (!isOnline) return { state: 'unavailable', reason: 'offline' }
        if (isLoading) return { state: 'checking' }
        return isActive
            ? { state: 'available' }
            : { state: 'unavailable', reason: 'syncDisabled' }
    }, [isOnline, isActive, isLoading])
}

/**
 * `useOnlineFeature` plus a live `GET /subs/connection/check`, for the actions the
 * backend routes through the Service Portal (license activation, the subscription
 * list). The browser being online says nothing about whether the *backend* can reach
 * the portal — a proxy, a firewall or a missing portal token breaks it while the tab
 * stays perfectly connected — so those actions need this, not `useOnlineFeature`.
 *
 * The probe is skipped until the cheaper checks pass, so an offline tab or a disabled
 * install never issues it.
 */
export function useServicePortalFeature(scope?: OnlineSyncScope): OnlineFeatureAvailability {
    const base = useOnlineFeature(scope)
    const isBaseAvailable = base.state === 'available'
    const { isError, isLoading, isUninitialized } = useCheckServicePortalConnectionQuery(
        undefined,
        { skip: !isBaseAvailable },
    )

    return useMemo(() => {
        if (!isBaseAvailable) return base
        if (isUninitialized || isLoading) return { state: 'checking' }
        return isError
            ? { state: 'unavailable', reason: 'portalUnreachable' }
            : { state: 'available' }
    }, [base, isBaseAvailable, isUninitialized, isLoading, isError])
}
