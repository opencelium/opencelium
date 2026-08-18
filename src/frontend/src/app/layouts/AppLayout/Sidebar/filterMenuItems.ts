import type { PermissionComponent } from '@/engine/policy'
import { hasComponentPermission } from '@/engine/policy'

type MenuItem = {
    key: string
    children?: MenuItem[]
    [extra: string]: unknown
}

/**
 * Drops menu entries (and their groups) the user lacks READ on, per `componentMap`
 * (menu key → permission component). Entries with no mapping are always kept.
 * Recurses into `children` so a group disappears once every child is filtered out.
 */
export function filterMenuItems<T extends MenuItem>(
    items: T[],
    permissions: string[],
    componentMap: Partial<Record<string, PermissionComponent>>,
): T[] {
    return items
        .map((item) =>
            item.children ? { ...item, children: filterMenuItems(item.children, permissions, componentMap) } : item,
        )
        .filter((item) => {
            if (item.children) return item.children.length > 0
            const component = componentMap[item.key]
            return !component || hasComponentPermission(permissions, component, 'READ')
        })
}
