import type { AuthStrategy } from '@features/auth/strategies/AuthStrategy.ts'
import type { AuthSession, AuthUser } from '@entities/auth/model/types.ts'
import { apiFetch } from '@shared/api/apiFetch'
import { decodeJwt } from '@shared/api/decodeJwt'
import {extractNormalizedUser} from "@features/auth/utils.ts";

const TOKEN_KEY = 'oc_auth_token'

export class PasswordStrategy
    implements AuthStrategy<{ email: string; password: string }>
{
    async login(payload: { email: string; password: string }): Promise<AuthSession> {
        const { headers } = await apiFetch('/login', { method: 'POST', body: payload })
        const accessToken = (headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
        localStorage.setItem(TOKEN_KEY, accessToken)
        const user = await this.fetchUser(accessToken)
        const normalizedUser = extractNormalizedUser(user);
        return { accessToken, user, normalizedUser }
    }

    async refresh(): Promise<AuthSession | null> {
        const accessToken = localStorage.getItem(TOKEN_KEY)
        if (!accessToken) return null
        try {
            const user = await this.fetchUser(accessToken)
            const normalizedUser = extractNormalizedUser(user);
            return { accessToken, user, normalizedUser }
        } catch {
            localStorage.removeItem(TOKEN_KEY)
            return null
        }
    }

    async logout() {
        localStorage.removeItem(TOKEN_KEY)
        await apiFetch('/auth/logout', { method: 'POST' }).catch(() => null)
    }

    private async fetchUser(token: string): Promise<AuthUser> {
        const { userId } = decodeJwt<{ userId: number }>(token)
        const { data } = await apiFetch<AuthUser>(`/user/${userId}`, { token })
        return data
    }
}
