import type { AuthSession, AuthUser, TotpChallenge } from '@entities/auth/model/types.ts'
import { apiFetchWithHeaders } from '@shared/api/apiFetch'
import { decodeJwt } from '@shared/api/decodeJwt'
import { extractNormalizedUser } from '@features/auth/utils.ts'
import { clearSessionTiming, markSessionStarted } from '@features/auth/session/sessionTiming'

const TOKEN_KEY = 'oc_auth_token'
const USER_FETCH_RETRY_DELAY_MS = 500

/** Thrown when /login (or /totp-validate) succeeded but the follow-up user
 * fetch that hydrates the session never did — the credentials/code were
 * correct, so callers must not report this as invalid-credentials. */
export class SessionHydrationError extends Error {
    constructor(cause: unknown) {
        super('Login succeeded but the account could not be loaded')
        this.name = 'SessionHydrationError'
        this.cause = cause
    }
}

/**
 * A 2FA-enabled account gets a challenge body instead of a token. A bare { sessionId }
 * means the authenticator is already enrolled (verify); the presence of secretKey + qr
 * means this is the first-time enrolment (setup).
 */
export function asTotpChallenge(body: unknown): TotpChallenge | null {
    if (!body || typeof body !== 'object') return null
    const { sessionId, secretKey, qr } = body as Record<string, unknown>
    if (typeof sessionId !== 'string') return null
    if (typeof secretKey === 'string' && typeof qr === 'string') {
        return { mode: 'setup', sessionId, secretKey, qr }
    }
    return { mode: 'verify', sessionId }
}

export function readToken(): string | null {
    // Sessions are always persisted now — migrate a pre-existing "not remembered"
    // (sessionStorage-only) token from before Remember Me was removed, so it
    // survives across tabs/reloads too instead of quietly disappearing.
    const legacy = sessionStorage.getItem(TOKEN_KEY)
    if (legacy) {
        sessionStorage.removeItem(TOKEN_KEY)
        localStorage.setItem(TOKEN_KEY, legacy)
    }
    return localStorage.getItem(TOKEN_KEY)
}

export function writeToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token)
    markSessionStarted()
}

export function clearToken() {
    localStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(TOKEN_KEY)
    clearSessionTiming()
}

export const clearAuthTokens = clearToken

/** Shared tail of every login path — password, TOTP and OIDC alike: pull the bearer
 * token off the response and hydrate the user. */
export async function completeLogin(headers: Headers): Promise<AuthSession> {
    const accessToken = (headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
    writeToken(accessToken)
    let user: AuthUser
    try {
        user = await fetchAuthUser(accessToken)
    } catch (e) {
        // The token we just wrote is unusable without a hydrated user — drop it
        // rather than leaving an orphaned token that doesn't correspond to a
        // Redux session behind in storage.
        clearToken()
        throw new SessionHydrationError(e)
    }
    const normalizedUser = extractNormalizedUser(user)
    return { accessToken, user, normalizedUser }
}

/** One retry after a short delay — a freshly issued token can occasionally
 * not be recognized yet by whatever service backs /user (auth/user-service
 * eventual consistency), which would otherwise surface a spurious failure
 * despite /login having just succeeded. */
export async function fetchAuthUser(token: string): Promise<AuthUser> {
    const { userId } = decodeJwt<{ userId: number }>(token)
    try {
        return await fetchAuthUserOnce(userId, token)
    } catch {
        await new Promise((resolve) => setTimeout(resolve, USER_FETCH_RETRY_DELAY_MS))
        return await fetchAuthUserOnce(userId, token)
    }
}

async function fetchAuthUserOnce(userId: number, token: string): Promise<AuthUser> {
    const { data } = await apiFetchWithHeaders<AuthUser>(`/user/${userId}`, { token })
    if (!data) throw new Error('Empty user response')
    return data
}
