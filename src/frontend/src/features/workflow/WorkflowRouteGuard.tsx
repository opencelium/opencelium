import { useAuth } from '@features/auth/useAuth'
import { hasComponentPermission } from '@/engine/policy'
import NoAccess from '@shared/ui/feedback/NoAccess'
import Workflow from './index'

type Props = {
    mode: 'create' | 'update'
}

/**
 * The workflow editor is hand-written (not EntityDefinition-driven), so it
 * doesn't go through EntityWizard's access check — gate it here instead.
 * Update falls back to a read-only editor for CONNECTION.READ-only users
 * (Workflow already supports this via its `readOnly` prop) rather than a
 * hard block, mirroring how other read-only surfaces behave in this app.
 */
export function WorkflowRouteGuard({ mode }: Props) {
    const { normalizedUser } = useAuth()
    const permissions = normalizedUser?.permissions ?? []

    if (mode === 'create') {
        if (!hasComponentPermission(permissions, 'CONNECTION', 'CREATE')) return <NoAccess />
        return <Workflow />
    }

    if (hasComponentPermission(permissions, 'CONNECTION', 'UPDATE')) return <Workflow />
    if (hasComponentPermission(permissions, 'CONNECTION', 'READ')) return <Workflow readOnly />
    return <NoAccess />
}
