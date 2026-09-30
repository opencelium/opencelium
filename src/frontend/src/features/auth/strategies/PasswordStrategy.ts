import type { AuthStrategy } from '@features/auth/strategies/AuthStrategy.ts'
import type { AuthSession, LoginResult, TotpValidateInput } from '@entities/auth/model/types.ts'
import { apiFetchWithHeaders } from '@shared/api/apiFetch'
import { apiExecutor } from '@shared/api/apiExecutor'
import {extractNormalizedUser} from "@features/auth/utils.ts"
import {
    asTotpChallenge,
    clearToken,
    completeLogin,
    fetchAuthUser,
    readToken,
} from '@features/auth/session/completeLogin'
import {
    isSessionExpired,
    recordActivity,
} from '@features/auth/session/sessionTiming'

type LoginPayload = { email: string; password: string }

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
        return { status: 'authenticated', session: await completeLogin(headers) }
    }

    async validateTotp({ code, sessionId }: TotpValidateInput): Promise<AuthSession> {
        const { headers } = await apiFetchWithHeaders('/totp-validate', {
            method: 'POST',
            body: { code, sessionId },
            timeoutMs: 15_000,
        })
        return completeLogin(headers)
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
            const user = await fetchAuthUser(accessToken)
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
}
