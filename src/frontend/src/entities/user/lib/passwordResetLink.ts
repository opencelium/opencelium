import type { PasswordResetLinkDto } from '@entities/user/model/types'

export type ResetLinkFailure = 'ldapAccount' | 'userNotFound' | 'notAvailable'

export function buildPasswordResetLinkUrl(userId: number): string {
    return `/user/${userId}/password-reset-link`
}

export function buildPasswordResetUrl(token: string, origin: string): string {
    return `${origin}/set-password?token=${encodeURIComponent(token)}`
}

export function isPasswordResetLinkDto(value: unknown): value is PasswordResetLinkDto {
    if (!value || typeof value !== 'object') return false
    const { token, expiresAt } = value as Record<string, unknown>
    return typeof token === 'string' && token.length > 0 && typeof expiresAt === 'string'
}

/**
 * Maps the failures the reset-link dialog explains itself. Anything else (401/403,
 * 5xx, network) returns null and goes through the error bus, so session expiry
 * keeps working.
 */
export function resolveResetLinkFailure(error: unknown): ResetLinkFailure | null {
    if (!error || typeof error !== 'object') return null
    const { status, data } = error as { status?: unknown; data?: unknown }
    const code = data && typeof data === 'object' ? (data as { error?: unknown }).error : undefined

    if (code === 'LDAP_ACCOUNT') return 'ldapAccount'
    if (code === 'USER_NOT_FOUND') return 'userNotFound'
    // An unmapped route: OC's NoHandlerFoundException handler answers HTTP 400 with
    // error "BAD_GATEWAY"; plain Spring answers 404/405 without a known code.
    if (code === 'BAD_GATEWAY' || status === 404 || status === 405) return 'notAvailable'
    return null
}
