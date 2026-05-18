import type { AuthStrategy } from '@features/auth/strategies/AuthStrategy.ts'
import type { AuthSession, AuthUser } from '@entities/auth/model/types.ts'
import { apiFetch } from '@shared/api/apiFetch'
import { decodeJwt } from '@shared/api/decodeJwt'
import {extractNormalizedUser} from "@features/auth/utils.ts";

const TOKEN_KEY = 'oc_auth_token'
const PERSISTENT_KEY = 'oc_auth_persistent'

type LoginPayload = { email: string; password: string; rememberMe?: boolean }

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
    async login(payload: LoginPayload): Promise<AuthSession> {
        const { email, password, rememberMe = false } = payload
        const { headers } = await apiFetch('/login', {
            method: 'POST',
            body: { email, password },
            timeoutMs: 15_000,
        })
        const accessToken = (headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
        writeToken(accessToken, rememberMe)
        const user = await this.fetchUser(accessToken)
        const normalizedUser = extractNormalizedUser(user);
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
        await apiFetch('/auth/logout', { method: 'POST' }).catch(() => null)
    }

    private async fetchUser(token: string): Promise<AuthUser> {
        const { userId } = decodeJwt<{ userId: number }>(token)
        const { data } = await apiFetch<AuthUser>(`/user/${userId}`, { token })
        return data
    }
}
