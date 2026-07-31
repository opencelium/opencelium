import { useGetActiveSubscriptionQuery } from '@entities/subscription/api/subscriptionApi'
import type { ActiveSubscription } from '@entities/subscription/model/types'

export type SubscriptionIssue = 'noSubscription' | 'expired' | 'opsLimit'

export function resolveSubscriptionIssue(
    subscription: ActiveSubscription | undefined,
): SubscriptionIssue | null {
    if (!subscription?.subId) return 'noSubscription'
    const isExpired =
        !subscription.active ||
        (subscription.endDate > 0 && subscription.endDate < Date.now())
    if (isExpired) return 'expired'
    const limit = subscription.totalOperationUsage + (subscription.extraOps ?? 0)
    if (subscription.totalOperationUsage > 0 && subscription.currentOperationUsage >= limit) {
        return 'opsLimit'
    }
    return null
}

/**
 * Subscription health used to gate execution features (manual schedule run,
 * workflow test run). `issue` stays null while the subscription is loading so
 * controls don't flash disabled on app start.
 */
export function useSubscriptionIssue(): {
    issue: SubscriptionIssue | null
    isLoading: boolean
} {
    const { data, isLoading } = useGetActiveSubscriptionQuery()
    return { issue: isLoading ? null : resolveSubscriptionIssue(data), isLoading }
}
