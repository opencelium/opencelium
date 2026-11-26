import {describe, expect, it} from 'vitest'
import {
    buildPasswordResetUrl,
    isPasswordResetLinkDto,
    resolveResetLinkFailure,
} from './passwordResetLink'

describe('buildPasswordResetUrl', () => {
    it('points at /set-password on the given origin with an encoded token', () => {
        expect(buildPasswordResetUrl('a+b/c', 'https://oc.example.com'))
            .toBe('https://oc.example.com/set-password?token=a%2Bb%2Fc')
    })
})

describe('isPasswordResetLinkDto', () => {
    it('accepts the expected shape', () => {
        expect(isPasswordResetLinkDto({token: 't', expiresAt: '2026-11-25T10:00:00Z'})).toBe(true)
    })

    it.each([null, {}, {token: '', expiresAt: 'x'}, {token: 't'}, {message: 'ok'}])('rejects %j', (value) => {
        expect(isPasswordResetLinkDto(value)).toBe(false)
    })
})

describe('resolveResetLinkFailure', () => {
    it('maps the LDAP code', () => {
        expect(resolveResetLinkFailure({status: 400, data: {error: 'LDAP_ACCOUNT'}})).toBe('ldapAccount')
    })

    it('maps a missing user before the generic 404', () => {
        expect(resolveResetLinkFailure({status: 404, data: {error: 'USER_NOT_FOUND'}})).toBe('userNotFound')
    })

    it.each([404, 405])('treats an unknown %i as an endpoint this backend lacks', (status) => {
        expect(resolveResetLinkFailure({status, data: {error: 'Not Found'}})).toBe('notAvailable')
    })

    it('recognises the OC backend answer for a route it does not have', () => {
        expect(resolveResetLinkFailure({
            status: 400,
            data: {status: 502, error: 'BAD_GATEWAY', message: 'No endpoint POST /user/2/password-reset-link.'},
        })).toBe('notAvailable')
    })

    it.each([401, 403, 500, 'FETCH_ERROR'])('leaves %s to the error bus', (status) => {
        expect(resolveResetLinkFailure({status, data: null})).toBeNull()
    })

    it('ignores non-objects', () => {
        expect(resolveResetLinkFailure(undefined)).toBeNull()
    })
})
