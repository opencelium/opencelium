import {PolicyContext, PolicyContextUser} from './types'
import type {AuthUser} from "@entities/auth/model/types.ts";
import type {NormalizedUser} from "@features/auth/types.ts";


export function setUserPolicyContext (authUser?: AuthUser, normalizedUser?: NormalizedUser): PolicyContextUser {
    return {
        id: authUser?.userId || 0,
        permissions: normalizedUser?.permissions || [],
        roles: normalizedUser?.roles || [],
        attributes: {},
    }
}
export function createPolicyContext(
    partial: Partial<PolicyContext>
): PolicyContext {
    return {
        user: setUserPolicyContext(),
        mode: partial.mode,
        entity: partial.entity,
        record: partial.record,
        resource: partial.resource,
    }
}
