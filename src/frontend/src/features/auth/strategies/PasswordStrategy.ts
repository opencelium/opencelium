import type { AuthStrategy } from '@features/auth/strategies/AuthStrategy.ts'
import type {
    AuthSession,
    AuthUser,
    LoginResult,
    TotpChallenge,
    TotpValidateInput,
} from '@entities/auth/model/types.ts'
import { apiFetchWithHeaders } from '@shared/api/apiFetch'
import { apiExecutor } from '@shared/api/apiExecutor'
import { decodeJwt } from '@shared/api/decodeJwt'
import {extractNormalizedUser} from "@features/auth/utils.ts";
import {
    clearSessionTiming,
    isSessionExpired,
    markSessionStarted,
    recordActivity,
} from '@features/auth/session/sessionTiming'

const TOKEN_KEY = 'oc_auth_token'
const USER_FETCH_RETRY_DELAY_MS = 500

type LoginPayload = { email: string; password: string }

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
function asTotpChallenge(body: unknown): TotpChallenge | null {
    if (!body || typeof body !== 'object') return null
    const { sessionId, secretKey, qr } = body as Record<string, unknown>
    if (typeof sessionId !== 'string') return null
    if (typeof secretKey === 'string' && typeof qr === 'string') {
        return { mode: 'setup', sessionId, secretKey, qr }
    }
    return { mode: 'verify', sessionId }
}

function readToken(): string | null {
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

function writeToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token)
    markSessionStarted()
}

function clearToken() {
    localStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(TOKEN_KEY)
    clearSessionTiming()
}

export const clearAuthTokens = clearToken

export class PasswordStrategy implements AuthStrategy<LoginPayload> {
    async login(payload: LoginPayload): Promise<LoginResult> {
        const { email, password } = payload
        const { data, headers } = await apiFetchWithHeaders('/login', {
            method: 'POST',
            body: { email, password },
            timeoutMs: 15_000,
        })
        const challenge = asTotpChallenge(data)
        if (challenge) return { status: 'totp-required', challenge }
        return { status: 'authenticated', session: await this.completeLogin(headers) }
    }

    async validateTotp({ code, sessionId }: TotpValidateInput): Promise<AuthSession> {
        const { headers } = await apiFetchWithHeaders('/totp-validate', {
            method: 'POST',
            body: { code, sessionId },
            timeoutMs: 15_000,
        })
        return this.completeLogin(headers)
    }

    /** Shared tail of both login paths: pull the bearer token off the response and hydrate the user. */
    private async completeLogin(headers: Headers): Promise<AuthSession> {
        const accessToken = (headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
        writeToken(accessToken)
        let user: AuthUser
        try {
            user = await this.fetchUser(accessToken)
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

    async refresh(): Promise<AuthSession | null> {
        const accessToken = readToken()
        if (!accessToken) return null
        // Idle/absolute timeout is tracked client-side (see sessionTiming) — check it
        // before trusting a stored token, so a tab reopened well past either window
        // doesn't silently resume a session that should have expired.
        if (isSessionExpired()) {
            clearToken()
            return null
        }
        try {
            const user = await this.fetchUser(accessToken)
            const normalizedUser = extractNormalizedUser(user);
            recordActivity()
            return { accessToken, user, normalizedUser }
        } catch {
            clearToken()
            return null
        }
    }

    async logout() {
        clearToken()
        await apiExecutor({
            url: '/auth/logout',
            method: 'POST',
            options: { ignoreError: true },
        }).catch(() => null)
    }

    /** One retry after a short delay — a freshly issued token can occasionally
     * not be recognized yet by whatever service backs /user (auth/user-service
     * eventual consistency), which would otherwise surface a spurious failure
     * despite /login having just succeeded. */
    private async fetchUser(token: string): Promise<AuthUser> {
        const { userId } = decodeJwt<{ userId: number }>(token)
        try {
            return await this.fetchUserOnce(userId, token)
        } catch {
            await new Promise((resolve) => setTimeout(resolve, USER_FETCH_RETRY_DELAY_MS))
            return await this.fetchUserOnce(userId, token)
        }
    }

    private async fetchUserOnce(userId: number, token: string): Promise<AuthUser> {
        const { data } = await apiFetchWithHeaders<AuthUser>(`/user/${userId}`, { token })
        if (!data) throw new Error('Empty user response')
        return data
    }
}
