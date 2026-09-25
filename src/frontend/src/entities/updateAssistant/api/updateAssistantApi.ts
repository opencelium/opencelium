import { baseApi } from '@shared/api/baseApi'
import type { AppVersion, InstallationInfo, SystemHealth, UpdateVersion } from '../model/types'
import { UPDATE_ASSISTANT_TAG } from './updateAssistant.tags'

export const updateAssistantApi = baseApi.injectEndpoints({
    endpoints: (b) => ({
        getInstallationInfo: b.query<InstallationInfo, void>({
            query: () => '/assistant/oc/installation',
            providesTags: [{ type: UPDATE_ASSISTANT_TAG as any, id: 'INSTALLATION' }],
        }),

        getAppVersion: b.query<AppVersion, void>({
            query: () => '/assistant/oc/version',
            // The footer is decoration: a version that can't be read should leave the
            // build-time fallback standing, not raise a toast on every page it renders on.
            extraOptions: { ignoreError: true },
            // No tag: the running backend's version cannot change under a live
            // session — the update that changes it restarts the server and logs
            // everyone out — so nothing exists to invalidate this with.
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
    useGetAppVersionQuery,
    useGetInstallationInfoQuery,
    useGetSystemHealthQuery,
    useGetOnlineVersionsQuery,
    useGetOfflineVersionsQuery,
    useMigrateUpdateMutation,
    useDeleteOfflineVersionMutation,
} = updateAssistantApi
