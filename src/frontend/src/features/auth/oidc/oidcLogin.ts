import type { LoginResult } from '@entities/auth/model/types.ts'
import { apiFetchWithHeaders } from '@shared/api/apiFetch'
import { runtimeConfig } from '@shared/config/runtimeConfig'
import { asTotpChallenge, completeLogin } from '@features/auth/session/completeLogin'

/**
 * Leaves the SPA entirely: the backend keeps the PKCE verifier in a signed cookie, redirects to
 * the identity provider and receives the authorization response on /oidc/callback.
 */
export function startOidcLogin(): void {
    window.location.href = `${runtimeConfig.apiUrl}/oidc/authorize`
}

/**
 * Second leg of the handshake. The one-time code the backend appended to the frontend redirect is
 * traded for a session, or for a TOTP challenge when the account has 2FA enabled — same contract as
 * /login, because the backend issues the session through the same filter.
 */
export async function completeOidcLogin(code: string): Promise<LoginResult> {
    const { data, headers } = await apiFetchWithHeaders('/oidc/exchange', {
        method: 'POST',
        body: { code },
        timeoutMs: 15_000,
    })

    const challenge = asTotpChallenge(data)
    if (challenge) return { status: 'totp-required', challenge }

    return { status: 'authenticated', session: await completeLogin(headers) }
}
