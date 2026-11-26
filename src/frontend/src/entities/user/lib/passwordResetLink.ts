import type { PasswordResetLinkDto } from '@entities/user/model/types'

export type ResetLinkFailure = 'ldapAccount' | 'userNotFound' | 'emailNotFound' | 'emailFailed' | 'notAvailable'

export function buildPasswordResetLinkUrl(userId: number, sendEmail: boolean): string {
    return `/user/${userId}/password-link?sendEmail=${sendEmail}`
}

function isHttpUrl(value: string): boolean {
    try {
        const { protocol } = new URL(value)
        return protocol === 'https:' || protocol === 'http:'
    } catch {
        return false
    }
}

export type PasswordLinkResponse =
    | { kind: 'ok'; link: PasswordResetLinkDto }
    // The backend prefixes the token with opencelium.forgot-psw.base-url; when that is
    // unset the link comes back as "null?token=…".
    | { kind: 'baseUrlMissing' }
    | { kind: 'invalid' }

export function parsePasswordLinkResponse(value: unknown): PasswordLinkResponse {
    if (!value || typeof value !== 'object') return { kind: 'invalid' }
    const { link, expiresAt } = value as Record<string, unknown>
    if (typeof link !== 'string' || typeof expiresAt !== 'string') return { kind: 'invalid' }
    if (!isHttpUrl(link)) return { kind: 'baseUrlMissing' }
    return { kind: 'ok', link: { link, expiresAt } }
}

/**
 * Maps the failures the reset-link flow explains itself. Anything else (401/403,
 * other 5xx, network) returns null and goes through the error bus, so session
 * expiry keeps working.
 */
export function resolveResetLinkFailure(error: unknown): ResetLinkFailure | null {
    if (!error || typeof error !== 'object') return null
    const { status, data } = error as { status?: unknown; data?: unknown }
    const code = data && typeof data === 'object' ? (data as { error?: unknown }).error : undefined

    if (code === 'PASSWORD_MANAGED_EXTERNALLY') return 'ldapAccount'
    if (code === 'USER_NOT_EXIST') return 'userNotFound'
    if (code === 'EMAIL_NOT_FOUND') return 'emailNotFound'
    if (code === 'EMAIL_RECOVERY_FAILED') return 'emailFailed'
    // A backend without the endpoint (older jar): OC's NoHandlerFoundException handler
    // answers HTTP 400 with error "BAD_GATEWAY"; plain Spring answers 404/405 without a known code.
    if (code === 'BAD_GATEWAY' || status === 404 || status === 405) return 'notAvailable'
    return null
}
