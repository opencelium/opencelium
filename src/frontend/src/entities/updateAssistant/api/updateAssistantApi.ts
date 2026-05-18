import { baseApi } from '@shared/api/baseApi'
import type { SystemHealth, UpdateVersion } from '../model/types'
import { UPDATE_ASSISTANT_TAG } from './updateAssistant.tags'

export const updateAssistantApi = baseApi.injectEndpoints({
    endpoints: (b) => ({
        getSystemHealth: b.query<SystemHealth, void>({
            query: () => '/actuator/health',
            providesTags: [{ type: UPDATE_ASSISTANT_TAG as any, id: 'HEALTH' }],
        }),

        getOnlineVersions: b.query<UpdateVersion[], void>({
            query: () => '/assistant/oc/online/version/all',
            providesTags: [{ type: UPDATE_ASSISTANT_TAG as any, id: 'ONLINE_VERSIONS' }],
        }),

        getOfflineVersions: b.query<UpdateVersion[], void>({
            query: () => '/assistant/oc/offline/version/all',
            providesTags: [{ type: UPDATE_ASSISTANT_TAG as any, id: 'OFFLINE_VERSIONS' }],
        }),

        runUpdate: b.mutation<void, void>({
            query: () => ({
                url: '/assistant/oc/update',
                method: 'POST',
            }),
        }),

        deleteOfflineVersion: b.mutation<void, string>({
            query: (version) => ({
                url: `/assistant/zipfile/${encodeURIComponent(version)}`,
                method: 'DELETE',
            }),
            invalidatesTags: [{ type: UPDATE_ASSISTANT_TAG as any, id: 'OFFLINE_VERSIONS' }],
        }),
    }),
    overrideExisting: false,
})

export const {
    useGetSystemHealthQuery,
    useGetOnlineVersionsQuery,
    useGetOfflineVersionsQuery,
    useRunUpdateMutation,
    useDeleteOfflineVersionMutation,
} = updateAssistantApi
