import { baseApi } from '@/shared/api/baseApi'
import {INVOKER_TAG} from "@entities/invoker/api/invoker.tags.ts";
import type {Invoker} from "@entities/invoker/model/types.ts";

export const invokerApi = baseApi.injectEndpoints({
    endpoints: (b) => ({
        getInvokers: b.query<
            Invoker[],
            void
        >({
            query: () =>
                `/invoker/all`,
            providesTags: (result) =>
                result
                    ? [
                        { type: INVOKER_TAG, id: 'LIST' },
                        { type: 'Entity' as any, id: '/invoker/all' },
                        ...result.map((u) => ({ type: INVOKER_TAG, id: u.name })),
                    ]
                    : [{ type: INVOKER_TAG, id: 'LIST' }],
        }),
    }),
})

export const {
    useGetInvokersQuery,
} = invokerApi
