import { baseApi } from '@/shared/api/baseApi'
import {INVOKER_TAG} from "@entities/invoker/api/invoker.tags.ts";
import type {Invoker, InvokerRepositoryDownload} from "@entities/invoker/model/types.ts";

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
        // Installs every invoker the backend's configured repository holds; the
        // repository URL and branch are backend config, so there is nothing to pass.
        // A run that installed nothing still answers 200 with a populated `failed`,
        // and errors are reported by the caller (the onboarding step renders its own
        // copy for an unreachable repository), hence `ignoreError`.
        downloadInvokersFromRepository: b.mutation<InvokerRepositoryDownload, void>({
            query: () => ({
                url: '/invoker/remote',
                method: 'POST',
                customOptions: { ignoreError: true },
            }),
            // Cast as in uploadInvoker: baseApi declares no `tagTypes`, so tag
            // literals do not narrow on their own.
            invalidatesTags: [
                { type: INVOKER_TAG, id: 'LIST' },
                { type: 'Entity', id: '/invoker/all' },
            ] as never,
        }),
    }),
})

export const {
    useGetInvokersQuery,
    useDownloadInvokersFromRepositoryMutation,
} = invokerApi
