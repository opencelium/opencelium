import { baseApi } from '@/shared/api/baseApi'
import type { SupportFile } from '../model/types'

export const supportFileApi = baseApi.injectEndpoints({
    endpoints: (b) => ({
        getSupportFiles: b.query<SupportFile[], void>({
            query: () => `/connection/support-file/list`,
            providesTags: () => [
                { type: 'Entity' as any, id: '/connection/support-file/list' },
            ],
        }),
    }),
})

export const { useGetSupportFilesQuery } = supportFileApi
