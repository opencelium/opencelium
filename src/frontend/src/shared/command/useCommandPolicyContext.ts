import { useMemo } from 'react'
import { setUserPolicyContext, type PolicyContext } from '@/engine/policy'
import { useAuth } from '@features/auth/useAuth'

// Shared by the palette itself (gating suggestions as the user types) and the
// help dialog (gating which commands are listed in the reference) — both need
// the exact same access decision for a given node.
export function useCommandPolicyContext(): PolicyContext {
    const { user, normalizedUser } = useAuth()
    return useMemo(
        () => ({
            user: setUserPolicyContext(user, normalizedUser),
            resource: 'command-palette',
        }),
        [user, normalizedUser],
    )
}
