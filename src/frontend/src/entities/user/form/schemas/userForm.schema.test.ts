import { describe, expect, it } from 'vitest'
import { userFormSchema } from '@entities/user/form/schemas/userForm.schema.ts'

const base = {
    email: '',
    username: '',
    password: 'Abcdefg1!',
    repeatPassword: 'Abcdefg1!',
    userDetail: { name: 'Jane', surname: 'Doe' },
    userGroup: 1,
}

const errorPaths = (values: typeof base): string[] => {
    const result = userFormSchema.safeParse(values)
    return result.success ? [] : result.error.issues.map((issue) => issue.path.join('.'))
}

describe('userFormSchema email/username rule', () => {
    it('accepts an email without a username', () => {
        expect(errorPaths({ ...base, email: 'jane@example.com' })).toEqual([])
    })

    it('accepts a username without an email', () => {
        expect(errorPaths({ ...base, username: 'jane' })).toEqual([])
    })

    it('rejects when both are empty or whitespace, on both fields', () => {
        expect(errorPaths({ ...base, email: '  ', username: '' })).toEqual(['email', 'username'])
    })

    it('still rejects a malformed email', () => {
        expect(errorPaths({ ...base, email: 'not-an-email', username: 'jane' })).toEqual(['email'])
    })
})
