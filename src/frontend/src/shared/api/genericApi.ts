import { baseApi } from "./baseApi";

export const genericApi = baseApi.injectEndpoints({
    endpoints: (build) => ({
        fetchEntities: build.query<any, string>({
            query: (url) => url,
            extraOptions: { ignoreError: false },
            providesTags: (result, error, url) => [{ type: 'Entity' as any, id: url }],
        }),
        // 🟢 Generic create
        createEntity: build.mutation<any, { url: string; body: any; headers?: Record<string, string> }>({
            query: ({ url, body, headers }) => ({
                url,
                method: 'POST',
                body,
                headers,
            }),
            invalidatesTags: ['Entity' as any],
        }),
        // 🟢 Generic update
        updateEntity: build.mutation<any, { url: string; body: any }>({
            query: ({ url, body, headers }) => ({
                url,
                method: 'PUT',
                body,
                headers,
            }),
            invalidatesTags: ['Entity' as any],
        }),
        deleteEntity: build.mutation<void, { url: string }>({
            query: ({ url }) => ({
                url,
                method: 'DELETE',
            }),
            invalidatesTags: ['Entity' as any],
        }),
        generalRequest: build.mutation<
            { valid: boolean; message?: string },
            { url: string; method: string; body?: any, options: any }
        >({
            invalidatesTags: (_result, _error, arg) =>
                arg.method?.toUpperCase() === 'GET' || arg.options?.skipEntityInvalidation
                    ? []
                    : ['Entity' as any],
            async queryFn(args, api, extraOptions, baseQuery) {
                const result = await baseQuery(
                {
                        url: args.url,
                        method: args.method,
                        body: args.body,
                        customOptions: args.options,
                    },
                    api,
                    {
                        ...extraOptions,
                        headers: args.options?.headers,
                        ignoreError: args.options?.ignoreError,
                    }
                )

                if (result.error) {
                    return { error: result.error }
                }

                return { data: result.data }
            },
        }),
    }),
});
export const {
    useFetchEntitiesQuery,
    useCreateEntityMutation,
    useUpdateEntityMutation,
    useDeleteEntityMutation,
    useGeneralRequestMutation,
} = genericApi;
