import { baseApi } from '@/shared/api/baseApi'
import type { OidcConfig, OidcInfo } from '@entities/oidc/model/types.ts'

export const oidcApi = baseApi.injectEndpoints({
    endpoints: (b) => ({
        // Prefixed on purpose: endpoint names live in one flat namespace per base api, and a name
        // that already exists (the LDAP config api defines 'getConfig') is silently ignored, which
        // would bind these hooks to the other entity's endpoint.
        getOidcInfo: b.query<OidcInfo, void>({
            query: () => `/oidc/info`,
        }),
        getOidcConfig: b.query<OidcConfig, void>({
            // ignoreError: a 403 here means "not an administrator", not "your session is gone" -
            // without this the shared error bus treats the denial as a dead session and logs the
            // user out. The base query reads the flag from the args.
            query: () => ({ url: `/oidc/config`, customOptions: { ignoreError: true } }),
        }),
    }),
    overrideExisting: false,
})

export const {
    useGetOidcInfoQuery,
    useGetOidcConfigQuery,
} = oidcApi
