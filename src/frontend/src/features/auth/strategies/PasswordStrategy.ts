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

const TOKEN_KEY = 'oc_auth_token'
const PERSISTENT_KEY = 'oc_auth_persistent'

type LoginPayload = { email: string; password: string; rememberMe?: boolean }

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

function readToken(): { token: string | null; persistent: boolean } {
    const persistent = localStorage.getItem(PERSISTENT_KEY) === '1'
    const token =
        (persistent ? localStorage.getItem(TOKEN_KEY) : sessionStorage.getItem(TOKEN_KEY)) ??
        // fall back to either store so legacy sessions survive the upgrade
        localStorage.getItem(TOKEN_KEY) ??
        sessionStorage.getItem(TOKEN_KEY)
    return { token, persistent }
}

function writeToken(token: string, rememberMe: boolean) {
    // wipe both stores first so we never have stale tokens in the unused slot
    localStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(TOKEN_KEY)
    if (rememberMe) {
        localStorage.setItem(TOKEN_KEY, token)
        localStorage.setItem(PERSISTENT_KEY, '1')
    } else {
        sessionStorage.setItem(TOKEN_KEY, token)
        localStorage.removeItem(PERSISTENT_KEY)
    }
}

function clearToken() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(PERSISTENT_KEY)
    sessionStorage.removeItem(TOKEN_KEY)
}

export class PasswordStrategy implements AuthStrategy<LoginPayload> {
    async login(payload: LoginPayload): Promise<LoginResult> {
        const { email, password, rememberMe = false } = payload
        const { data, headers } = await apiFetchWithHeaders('/login', {
            method: 'POST',
            body: { email, password },
            timeoutMs: 15_000,
        })
        const challenge = asTotpChallenge(data)
        if (challenge) return { status: 'totp-required', challenge }
        return { status: 'authenticated', session: await this.completeLogin(headers, rememberMe) }
    }

    async validateTotp({ code, sessionId, rememberMe = false }: TotpValidateInput): Promise<AuthSession> {
        const { headers } = await apiFetchWithHeaders('/totp-validate', {
            method: 'POST',
            body: { code, sessionId },
            timeoutMs: 15_000,
        })
        return this.completeLogin(headers, rememberMe)
    }

    /** Shared tail of both login paths: pull the bearer token off the response and hydrate the user. */
    private async completeLogin(headers: Headers, rememberMe: boolean): Promise<AuthSession> {
        const accessToken = (headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
        writeToken(accessToken, rememberMe)
        const user = await this.fetchUser(accessToken)
        const normalizedUser = extractNormalizedUser(user)
        return { accessToken, user, normalizedUser }
    }

    async refresh(): Promise<AuthSession | null> {
        const { token: accessToken } = readToken()
        if (!accessToken) return null
        try {
            const user = await this.fetchUser(accessToken)
            const normalizedUser = extractNormalizedUser(user);
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

    private async fetchUser(token: string): Promise<AuthUser> {
        const { userId } = decodeJwt<{ userId: number }>(token)
        const { data } = await apiFetchWithHeaders<AuthUser>(`/user/${userId}`, { token })
        if (!data) throw new Error('Empty user response')
        return data
    }
}
