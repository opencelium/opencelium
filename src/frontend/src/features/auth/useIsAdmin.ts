import { useAuth } from '@features/auth/useAuth'

// The backend derives the 'Admin' authority from the user group's name
// (UserPrincipals.getAuthorities), so the role name is the only signal the
// frontend has — an admin-only endpoint still answers 403 on its own.
const isAdminRole = (roles: string[]) => roles.some(role => role.toLowerCase() === 'admin')

/** True when the signed-in user belongs to the admin group. */
export function useIsAdmin(): boolean {
    const { normalizedUser } = useAuth()
    return isAdminRole(normalizedUser?.roles ?? [])
}
