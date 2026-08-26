import { describe, expect, it } from 'vitest'
import { profileDetailsSchema } from './profileDetails.schema'

const base = {
    userTitle: null,
    name: 'Ada',
    surname: 'Lovelace',
    department: '',
    organization: '',
    phoneNumber: '',
    email: 'ada@opencelium.io',
    username: '',
}

const errorPaths = (values: Record<string, unknown>): string[] => {
    const result = profileDetailsSchema.safeParse(values)
    return result.success ? [] : result.error.issues.map((issue) => issue.path.join('.'))
}

describe('profileDetailsSchema', () => {
    it('accepts an email without a username', () => {
        expect(errorPaths(base)).toEqual([])
    })

    it('accepts a username without an email', () => {
        expect(errorPaths({ ...base, email: '', username: 'ada' })).toEqual([])
    })

    it('rejects clearing both credentials, reporting on each field', () => {
        expect(errorPaths({ ...base, email: '', username: '' })).toEqual(['email', 'username'])
    })

    it('rejects a malformed email even when a username carries the login', () => {
        expect(errorPaths({ ...base, email: 'not-an-email', username: 'ada' })).toEqual(['email'])
    })

    it('rejects a username over 255 characters', () => {
        expect(errorPaths({ ...base, username: 'a'.repeat(256) })).toEqual(['username'])
    })
})
