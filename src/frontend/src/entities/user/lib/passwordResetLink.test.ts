import {describe, expect, it} from 'vitest'
import {
    buildPasswordResetLinkUrl,
    parsePasswordLinkResponse,
    resolveResetLinkFailure,
} from './passwordResetLink'

describe('buildPasswordResetLinkUrl', () => {
    it.each([true, false])('passes sendEmail=%s as a query parameter', (sendEmail) => {
        expect(buildPasswordResetLinkUrl(42, sendEmail)).toBe(`/user/42/password-link?sendEmail=${sendEmail}`)
    })
})

describe('parsePasswordLinkResponse', () => {
    const expiresAt = '2026-11-27T10:15:30Z'

    it('accepts the backend shape', () => {
        const link = 'https://oc.example.com/set-password?token=Hk3v0QpN2xT7bW9cLq4mR8sYv1aD5eF6gH0jK3nP2uZ'
        expect(parsePasswordLinkResponse({link, expiresAt})).toEqual({kind: 'ok', link: {link, expiresAt}})
    })

    it.each(['null?token=abc', '/set-password?token=abc', 'javascript:alert(1)'])(
        'reports a missing base-url for %s',
        (link) => {
            expect(parsePasswordLinkResponse({link, expiresAt})).toEqual({kind: 'baseUrlMissing'})
        },
    )

    it.each([null, {}, {link: 'https://oc.example.com/set-password?token=t'}, {token: 't', expiresAt}])(
        'rejects %j',
        (value) => {
            expect(parsePasswordLinkResponse(value)).toEqual({kind: 'invalid'})
        },
    )
})

describe('resolveResetLinkFailure', () => {
    it.each([
        [400, 'PASSWORD_MANAGED_EXTERNALLY', 'ldapAccount'],
        [404, 'USER_NOT_EXIST', 'userNotFound'],
        [400, 'EMAIL_NOT_FOUND', 'emailNotFound'],
        [503, 'EMAIL_RECOVERY_FAILED', 'emailFailed'],
    ])('maps %i %s', (status, error, expected) => {
        expect(resolveResetLinkFailure({status, data: {error}})).toBe(expected)
    })

    it.each([404, 405])('treats an unknown %i as an endpoint this backend lacks', (status) => {
        expect(resolveResetLinkFailure({status, data: {error: 'Not Found'}})).toBe('notAvailable')
    })

    it('recognises the OC backend answer for a route it does not have', () => {
        expect(resolveResetLinkFailure({
            status: 400,
            data: {status: 502, error: 'BAD_GATEWAY', message: 'No endpoint POST /user/2/password-link.'},
        })).toBe('notAvailable')
    })

    it.each([401, 403, 500, 503, 'FETCH_ERROR'])('leaves %s without a known code to the error bus', (status) => {
        expect(resolveResetLinkFailure({status, data: null})).toBeNull()
    })

    it('ignores non-objects', () => {
        expect(resolveResetLinkFailure(undefined)).toBeNull()
    })
})
