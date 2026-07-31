import { baseApi } from '@shared/api/baseApi'
import { SYSTEM_CONFIG_TAG } from './systemConfig.tags'
import type {
    ApplicationConfigPatchRequest,
    ApplicationConfigPatchResponse,
    ApplicationConfigResponse,
} from '../model/types'

export const systemConfigApi = baseApi.injectEndpoints({
    endpoints: (b) => ({
        getApplicationConfig: b.query<ApplicationConfigResponse, void>({
            query: () => '/application-config',
            providesTags: [{ type: SYSTEM_CONFIG_TAG as never, id: 'CONFIG' }],
        }),
        updateApplicationConfig: b.mutation<ApplicationConfigPatchResponse, ApplicationConfigPatchRequest>({
            query: (body) => ({
                url: '/application-config',
                method: 'PATCH',
                body,
            }),
            invalidatesTags: [{ type: SYSTEM_CONFIG_TAG as never, id: 'CONFIG' }],
        }),
    }),
    overrideExisting: false,
})

export const {
    useGetApplicationConfigQuery,
    useUpdateApplicationConfigMutation,
} = systemConfigApi
