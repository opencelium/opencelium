import { baseApi } from '@shared/api/baseApi'
import type { AppLogoValue, SystemSettingDTO, SystemSettingName } from '@entities/systemSetting/model/types'

/**
 * No cache tags here: `baseApi` declares no `tagTypes`, so RTK Query would ignore them
 * anyway. Consumers of a setting apply the new value locally after a successful write —
 * the theme is registered client-side, so there is no second reader to invalidate.
 */
export const systemSettingApi = baseApi.injectEndpoints({
    endpoints: b => ({
        /**
         * A 404 means the setting was never saved — a normal state every client answers
         * with its own defaults, so `ignoreError` keeps it off the error bus (it would
         * otherwise raise a toast on every login of every user).
         */
        getSystemSetting: b.query<SystemSettingDTO, SystemSettingName>({
            query: name => `/system-setting/${name}`,
            extraOptions: { ignoreError: true },
        }),
        saveSystemSetting: b.mutation<SystemSettingDTO, { name: SystemSettingName; value: unknown }>({
            query: ({ name, value }) => ({
                url: `/system-setting/${name}`,
                method: 'PUT',
                body: { value },
            }),
        }),
        /**
         * `app_logo` is written as a file, not JSON — a PUT of that name is rejected by
         * the backend (RESERVED_SYSTEM_SETTING) so its row and its stored file cannot
         * drift apart. Content-Type is left unset on purpose: `baseQuery` detects the
         * FormData body and lets the browser add the multipart boundary.
         *
         * `ignoreError` because the caller reports the failure itself, naming the file
         * rules the backend rejected on; the error bus would toast a generic one beside it.
         */
        uploadSystemLogo: b.mutation<SystemSettingDTO<AppLogoValue>, File>({
            query: file => {
                const body = new FormData()
                body.append('file', file)
                return { url: '/system-setting/app_logo', method: 'POST', body }
            },
            extraOptions: { ignoreError: true },
        }),
        /**
         * Its own endpoint rather than `deleteSystemSetting('app_logo')`: this one also
         * deletes the stored file, and it reports its failure through the caller.
         */
        deleteSystemLogo: b.mutation<void, void>({
            query: () => ({ url: '/system-setting/app_logo', method: 'DELETE' }),
            extraOptions: { ignoreError: true },
        }),
        deleteSystemSetting: b.mutation<void, SystemSettingName>({
            query: name => ({
                url: `/system-setting/${name}`,
                method: 'DELETE',
            }),
        }),
    }),
})

export const {
    useGetSystemSettingQuery,
    useSaveSystemSettingMutation,
    useUploadSystemLogoMutation,
    useDeleteSystemLogoMutation,
    useDeleteSystemSettingMutation,
} = systemSettingApi
