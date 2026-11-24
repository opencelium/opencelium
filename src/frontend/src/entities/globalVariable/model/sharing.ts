import type { GlobalVariablePermissions, GlobalVariablePermissionsDto, VariablePermission } from './types'

export type GrantDraft = { userId: number; name: string; permissions: VariablePermission[] }

export const GRANTABLE: VariablePermission[] = ['VIEW_USE', 'EDIT', 'DELETE']

// EDIT and DELETE include VIEW_USE (FR-57): adding either adds it, removing it removes both.
export function togglePermission(current: VariablePermission[], permission: VariablePermission, isOn: boolean): VariablePermission[] {
    const next = new Set(current)
    if (isOn) {
        next.add(permission)
        if (permission !== 'VIEW_USE') next.add('VIEW_USE')
    } else {
        next.delete(permission)
        if (permission === 'VIEW_USE') {
            next.delete('EDIT')
            next.delete('DELETE')
        }
    }
    return GRANTABLE.filter((item) => next.has(item))
}

export const toGrantDrafts = (permissions: GlobalVariablePermissions): GrantDraft[] =>
    permissions.grants.map((grant) => ({ userId: grant.user.id, name: grant.user.name, permissions: grant.permissions }))

export const toPermissionsDto = (drafts: GrantDraft[], version: number): GlobalVariablePermissionsDto => ({
    grants: drafts.filter((draft) => draft.permissions.length > 0).map(({ userId, permissions }) => ({ userId, permissions })),
    version,
})
