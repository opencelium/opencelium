import { baseApi } from '@/shared/api/baseApi'
import type {
    ActiveSubscription,
    OperationUsageDetailRow,
    OperationUsageDetailsQuery,
    OperationUsageQuery,
    OperationUsageRow,
    PagedResponse,
    SyncStatus,
} from '@entities/subscription/model/types'
import { SUBSCRIPTION_TAG } from '@entities/subscription/api/subscription.tags'

export const subscriptionApi = baseApi.injectEndpoints({
    endpoints: (b) => ({
        getActiveSubscription: b.query<ActiveSubscription, void>({
            query: () => '/subs/active',
            providesTags: [{ type: SUBSCRIPTION_TAG, id: 'ACTIVE' }],
        }),
        getSyncStatus: b.query<SyncStatus, void>({
            query: () => '/sync-history/status',
            providesTags: [{ type: SUBSCRIPTION_TAG, id: 'SYNC' }],
        }),
        // Backend -> Service Portal reachability. The controller throws on an
        // unreachable portal, a missing token and an invalid one alike, so any
        // rejection means "cannot talk to the portal" — the distinction is not
        // available here. An unreachable portal is a state this UI renders, not a
        // failure to toast, hence `ignoreError`.
        // Deliberately untagged: the license actions invalidate SUBSCRIPTION_TAG
        // wholesale, and a probe of the network has no reason to re-run because a
        // license changed. The short cache instead re-probes on the next visit, so
        // fixing the portal settings does not need a page reload.
        checkServicePortalConnection: b.query<unknown, void>({
            query: () => '/subs/connection/check',
            extraOptions: { ignoreError: true },
            keepUnusedDataFor: 30,
        }),
        getOperationUsage: b.query<
            PagedResponse<OperationUsageRow>,
            OperationUsageQuery
        >({
            query: ({ page, size, startDate, endDate }) =>
                `/subs/operation/usage?page=${page}&size=${size}&startDate=${startDate}&endDate=${endDate}`,
            providesTags: [{ type: SUBSCRIPTION_TAG, id: 'USAGE' }],
        }),
        getOperationUsageDetails: b.query<
            PagedResponse<OperationUsageDetailRow>,
            OperationUsageDetailsQuery
        >({
            query: ({ id, page, size, startDate, endDate, sort = 'startDate,desc' }) =>
                `/subs/operation/usage/${id}/details?page=${page}&size=${size}&sort=${sort}&startDate=${startDate}&endDate=${endDate}`,
            providesTags: (_r, _e, arg) => [
                { type: SUBSCRIPTION_TAG, id: `DETAILS-${arg.id}` },
            ],
        }),
    }),
})

export const {
    useGetActiveSubscriptionQuery,
    useGetSyncStatusQuery,
    useCheckServicePortalConnectionQuery,
    useGetOperationUsageQuery,
    useGetOperationUsageDetailsQuery,
} = subscriptionApi
