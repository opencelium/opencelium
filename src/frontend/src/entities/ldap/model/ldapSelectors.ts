import type {User} from "@entities/user/model/types.ts";
import {useGetConfigQuery} from "@entities/ldap/api/ldapApi.ts";
import type {LdapConfig} from "@entities/ldap/model/types.ts";

type UseLdapResult = {
    config: LdapConfig[]
    isLoading: boolean
    isError: boolean
}
export function useLdap(
): UseLdapResult {
    const { data, isLoading, isError } =
        useGetConfigQuery()

    return {
        config: data ?? {},
        isLoading,
        isError,
    }
}
