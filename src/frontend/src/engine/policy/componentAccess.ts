import type { PolicyDefinition } from './types'

export type PermissionComponent =
    | 'CONNECTION'
    | 'CONNECTOR'
    | 'SCHEDULE'
    | 'USER'
    | 'USERGROUP'
    | 'MYPROFILE'
    | 'DASHBOARD'
    | 'APP'
    | 'INVOKER'

export type CrudAction = 'CREATE' | 'READ' | 'UPDATE' | 'DELETE'

export function componentPermission(component: PermissionComponent, action: CrudAction): string {
    return `${component}.${action}`
}

export function hasComponentPermission(
    permissions: string[],
    component: PermissionComponent,
    action: CrudAction,
): boolean {
    return permissions.includes(componentPermission(component, action))
}

/**
 * Entity-level access: each wizard mode requires its matching CRUD permission
 * (view requires READ). `strategy: 'forbid'` renders NoAccess instead of the
 * form when denied.
 */
export function buildEntityAccess(component: PermissionComponent): PolicyDefinition {
    return {
        strategy: 'forbid',
        rules: [
            { effect: 'allow', modes: ['create'], permissions: [componentPermission(component, 'CREATE')] },
            { effect: 'allow', modes: ['update'], permissions: [componentPermission(component, 'UPDATE')] },
            { effect: 'allow', modes: ['view'], permissions: [componentPermission(component, 'READ')] },
        ],
    }
}

/** Single-permission gate for one command-palette action node. Hides when denied. */
export function buildActionAccess(component: PermissionComponent, action: CrudAction): PolicyDefinition {
    return {
        strategy: 'hide',
        rules: [{ effect: 'allow', permissions: [componentPermission(component, action)] }],
    }
}
