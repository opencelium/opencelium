import type { LoginResult } from '@entities/auth/model/types.ts'
import { apiFetchWithHeaders } from '@shared/api/apiFetch'
import { runtimeConfig } from '@shared/config/runtimeConfig'
import { asTotpChallenge, completeLogin } from '@features/auth/session/completeLogin'

/**
 * Nonce of the login running in this tab. The backend only stores its hash, and /oidc/exchange
 * requires it back, so a one-time ticket can not be spent by another browser.
 */
const CLIENT_NONCE_KEY = 'oc_oidc_client_nonce'

function createClientNonce(): string {
    const bytes = new Uint8Array(32)
    crypto.getRandomValues(bytes)
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function readClientNonce(): string | null {
    return sessionStorage.getItem(CLIENT_NONCE_KEY)
}

/**
 * Leaves the SPA entirely: the backend keeps the PKCE verifier in a signed cookie, redirects to
 * the identity provider and receives the authorization response on /oidc/callback. The nonce stays
 * in this tab - sessionStorage survives the full page navigation but not another tab - and is what
 * later proves the session belongs to this browser.
 */
export function startOidcLogin(): void {
    const clientNonce = createClientNonce()
    sessionStorage.setItem(CLIENT_NONCE_KEY, clientNonce)

    window.location.href = `${runtimeConfig.apiUrl}/oidc/authorize?clientNonce=${encodeURIComponent(clientNonce)}`
}

/**
 * Second leg of the handshake. The one-time code the backend appended to the frontend redirect is
 * traded for a session, or for a TOTP challenge when the account has 2FA enabled — same contract as
 * /login, because the backend issues the session through the same filter.
 */
export async function completeOidcLogin(code: string): Promise<LoginResult> {
    const clientNonce = readClientNonce()
    if (!clientNonce) {
        // No login was started in this tab, so the code is somebody else's ticket being dropped on
        // this browser: refuse instead of signing in as whoever started that login.
        throw new Error('This browser did not start an OIDC login')
    }

    const { data, headers } = await apiFetchWithHeaders('/oidc/exchange', {
        method: 'POST',
        body: { code, clientNonce },
        timeoutMs: 15_000,
    })

    // The ticket is spent, so the nonce goes with it. A failed call above keeps it, which lets the
    // page be reloaded once more while the ticket is still alive.
    sessionStorage.removeItem(CLIENT_NONCE_KEY)

    const challenge = asTotpChallenge(data)
    if (challenge) return { status: 'totp-required', challenge }

    return { status: 'authenticated', session: await completeLogin(headers) }
}
