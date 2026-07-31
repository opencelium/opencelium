import type {AuthUser} from "@entities/auth/model/types.ts";
import type {NormalizedUser} from "@features/auth/types.ts";

export function extractPermissions(user: AuthUser): string[] {
    return user.userGroup.components.flatMap(c =>
        c.permissions.map(p => `${c.name}.${p}`)
    )
}

export function extractNormalizedUser(authUser: AuthUser): NormalizedUser {
    return {
        roles: [authUser.userGroup.name],
        permissions: extractPermissions(authUser)
    }
}
