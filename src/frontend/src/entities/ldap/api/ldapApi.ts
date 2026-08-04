import { baseApi } from '@/shared/api/baseApi'
import type {LdapConfig} from "@entities/ldap/model/types.ts";

export const ldapApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getConfig: b.query<
        LdapConfig[]
    >({
      query: () =>
          `/ldap/default/config`,
    }),
  }),
})

export const {
  useGetConfigQuery,
} = ldapApi
