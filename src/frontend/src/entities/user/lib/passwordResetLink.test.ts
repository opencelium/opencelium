import {describe, expect, it} from 'vitest'
import {
    buildPasswordResetLinkUrl,
    isPasswordResetLinkDto,
    resolveResetLinkFailure,
} from './passwordResetLink'

describe('buildPasswordResetLinkUrl', () => {
    it.each([true, false])('passes sendEmail=%s as a query parameter', (sendEmail) => {
        expect(buildPasswordResetLinkUrl(42, sendEmail)).toBe(`/user/42/password-link?sendEmail=${sendEmail}`)
    })
})

describe('isPasswordResetLinkDto', () => {
    it('accepts the backend shape', () => {
        expect(isPasswordResetLinkDto({
            link: 'https://oc.example.com/set-password?token=Hk3v0QpN2xT7bW9cLq4mR8sYv1aD5eF6gH0jK3nP2uZ',
            expiresAt: '2026-11-27T10:15:30Z',
        })).toBe(true)
    })

    it.each([
        null,
        {},
        {link: '', expiresAt: 'x'},
        {link: 'https://oc.example.com/set-password?token=t'},
        {link: 'javascript:alert(1)', expiresAt: '2026-11-27T10:15:30Z'},
        {link: 'not a url', expiresAt: '2026-11-27T10:15:30Z'},
        {token: 't', expiresAt: '2026-11-27T10:15:30Z'},
    ])('rejects %j', (value) => {
        expect(isPasswordResetLinkDto(value)).toBe(false)
    })
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
