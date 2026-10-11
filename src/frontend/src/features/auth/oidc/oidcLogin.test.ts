import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@shared/api/apiFetch', () => ({
    apiFetchWithHeaders: vi.fn(),
}))
vi.mock('@features/auth/session/completeLogin', () => ({
    asTotpChallenge: vi.fn(() => null),
    completeLogin: vi.fn(async () => ({ accessToken: 'token' })),
}))

import { apiFetchWithHeaders } from '@shared/api/apiFetch'
import { completeLogin } from '@features/auth/session/completeLogin'
import { runtimeConfig } from '@shared/config/runtimeConfig'
import { completeOidcLogin, startOidcLogin } from './oidcLogin'

// Regression coverage for a login-CSRF hole: /oidc/exchange used to accept any ticket from any
// browser, so an attacker could hand their own ticket to a victim and have the victim work inside
// the attacker's account. The nonce below is what ties the ticket to the browser that began it.

const CLIENT_NONCE_KEY = 'oc_oidc_client_nonce'
// 32 bytes of 0xaa, which is what the stubbed getRandomValues below produces.
const NONCE = 'aa'.repeat(32)

const fetchMock = apiFetchWithHeaders as unknown as ReturnType<typeof vi.fn>
const completeLoginMock = completeLogin as unknown as ReturnType<typeof vi.fn>

describe('OIDC login client nonce', () => {
    beforeEach(() => {
        sessionStorage.clear()
        fetchMock.mockReset()
        completeLoginMock.mockClear()
        // Deterministic randomness, so the assertions below can name the nonce.
        vi.stubGlobal('crypto', {
            getRandomValues: (bytes: Uint8Array) => bytes.fill(0xaa),
        })
        Object.defineProperty(window, 'location', { configurable: true, writable: true, value: { href: '' } })
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('sends a freshly generated nonce to /oidc/authorize and keeps it for this tab', () => {
        startOidcLogin()

        expect(window.location.href).toBe(`${runtimeConfig.apiUrl}/oidc/authorize?clientNonce=${NONCE}`)
        expect(sessionStorage.getItem(CLIENT_NONCE_KEY)).toBe(NONCE)
    })

    it('trades the code together with that nonce and forgets it afterwards', async () => {
        startOidcLogin()
        fetchMock.mockResolvedValue({
            data: {},
            headers: new Headers({ Authorization: 'Bearer token' }),
            status: 200,
        })

        await completeOidcLogin('one-time-code')

        expect(fetchMock).toHaveBeenCalledWith(
            '/oidc/exchange',
            expect.objectContaining({
                method: 'POST',
                body: { code: 'one-time-code', clientNonce: NONCE },
            }),
        )
        expect(sessionStorage.getItem(CLIENT_NONCE_KEY)).toBeNull()
        expect(completeLoginMock).toHaveBeenCalled()
    })

    it('refuses a code when this tab never started a login', async () => {
        await expect(completeOidcLogin('ticket-of-another-browser')).rejects.toThrow()

        expect(fetchMock).not.toHaveBeenCalled()
    })

    it('keeps the nonce when the exchange never reached the backend', async () => {
        startOidcLogin()
        fetchMock.mockRejectedValue(new Error('network down'))

        await expect(completeOidcLogin('one-time-code')).rejects.toThrow()

        // The ticket is still alive for a moment, so a reload may still spend it.
        expect(sessionStorage.getItem(CLIENT_NONCE_KEY)).toBe(NONCE)
    })
})
