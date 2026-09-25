import { describe, expect, it } from 'vitest'
import { resolveMasterPasswordErrorKey } from './resolveMasterPasswordErrorKey'

describe('resolveMasterPasswordErrorKey', () => {
    it('uses the error code when the bundle has copy for it', () => {
        expect(resolveMasterPasswordErrorKey({ error: 'MASTER_PASSWORD_WRONG' }))
            .toBe('masterPassword.error.MASTER_PASSWORD_WRONG')
    })

    it('recovers the code from the message when the backend rewrote it to the status phrase', () => {
        expect(resolveMasterPasswordErrorKey({
            error: 'INTERNAL_SERVER_ERROR',
            message: 'Invalid master password',
        })).toBe('masterPassword.error.MASTER_PASSWORD_WRONG')
    })

    it('matches the message regardless of case and surrounding space', () => {
        expect(resolveMasterPasswordErrorKey({ message: '  invalid Master Password ' }))
            .toBe('masterPassword.error.MASTER_PASSWORD_WRONG')
    })

    it('falls back to the generic copy for a code and a message it knows nothing about', () => {
        expect(resolveMasterPasswordErrorKey({ error: 'MASTER_PASSWORD_NOT_EXIST' }))
            .toBe('masterPassword.error.default')
        expect(resolveMasterPasswordErrorKey({ error: 'INTERNAL_SERVER_ERROR', message: 'boom' }))
            .toBe('masterPassword.error.default')
        expect(resolveMasterPasswordErrorKey(undefined)).toBe('masterPassword.error.default')
    })
})
