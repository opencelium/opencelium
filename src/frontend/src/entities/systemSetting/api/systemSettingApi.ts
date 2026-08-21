import { baseApi } from '@shared/api/baseApi'
import type { SystemSettingDTO, SystemSettingName } from '@entities/systemSetting/model/types'

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
    useDeleteSystemSettingMutation,
} = systemSettingApi
