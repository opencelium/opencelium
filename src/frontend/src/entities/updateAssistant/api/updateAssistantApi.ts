import { baseApi } from '@shared/api/baseApi'
import type { InstallationInfo, SystemHealth, UpdateVersion } from '../model/types'
import { UPDATE_ASSISTANT_TAG } from './updateAssistant.tags'

export const updateAssistantApi = baseApi.injectEndpoints({
    endpoints: (b) => ({
        getInstallationInfo: b.query<InstallationInfo, void>({
            query: () => '/assistant/oc/installation',
            providesTags: [{ type: UPDATE_ASSISTANT_TAG as any, id: 'INSTALLATION' }],
        }),

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

        migrateUpdate: b.mutation<void, { version: string }>({
            query: (body) => ({
                url: '/assistant/oc/migrate',
                method: 'POST',
                body,
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
    useGetInstallationInfoQuery,
    useGetSystemHealthQuery,
    useGetOnlineVersionsQuery,
    useGetOfflineVersionsQuery,
    useMigrateUpdateMutation,
    useDeleteOfflineVersionMutation,
} = updateAssistantApi
