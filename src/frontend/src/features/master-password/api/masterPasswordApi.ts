import { baseApi } from '@/shared/api/baseApi'

export const masterPasswordApi = baseApi.injectEndpoints({
    endpoints: (b) => ({
        checkMasterPassword: b.mutation<
            unknown,
            { masterPassword: string }
        >({
            query: ({ masterPassword }) => ({
                url: `/connector/master-password/status`,
                method: 'GET',
                headers: {
                    'x-master-password': masterPassword,
                },
                customOptions: {
                    ignoreError: true,
                },
            }),
        }),

        checkMasterPasswordExists: b.query<boolean, void>({
            query: () => ({
                url: `/connector/master-password/status/exist`,
                method: 'GET',
            }),
        }),
    }),
})

export const { useCheckMasterPasswordMutation, useCheckMasterPasswordExistsQuery } = masterPasswordApi
