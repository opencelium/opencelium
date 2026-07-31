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
    useGetOperationUsageQuery,
    useGetOperationUsageDetailsQuery,
} = subscriptionApi
