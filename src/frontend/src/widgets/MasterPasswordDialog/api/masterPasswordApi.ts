import { baseApi } from '@/shared/api/baseApi'

export const masterPasswordApi = baseApi.injectEndpoints({
    endpoints: (b) => ({
        checkMasterPassword: b.mutation<
            any,
            { masterPassword: string }
        >({
            query: ({ masterPassword }) => ({
                url: `/connector/master-password/status`,
                method: 'GET',
                headers: {
                    'x-master-password': masterPassword,
                },
                customOptions: {
                    ignoreError: true
                }
            }),
        }),
    }),
})

export const {
    useCheckMasterPasswordMutation,
} = masterPasswordApi
