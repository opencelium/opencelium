import type { ReactNode } from 'react'
import { useAuth } from '@features/auth/useAuth'
import { hasComponentPermission, type PermissionComponent } from '@/engine/policy'
import NoAccess from '@shared/ui/feedback/NoAccess'

type Props = {
    component: PermissionComponent
    children: ReactNode
}

/**
 * Gate for hand-rolled routes that bypass EntityWizard's own access check
 * (e.g. a custom `{type: 'view'}` route with its own element). Blocks the
 * whole page unless the user has READ on `component`.
 */
export function RequireComponentRead({ component, children }: Props) {
    const { normalizedUser } = useAuth()
    const allowed = hasComponentPermission(normalizedUser?.permissions ?? [], component, 'READ')
    if (!allowed) return <NoAccess />
    return <>{children}</>
}
