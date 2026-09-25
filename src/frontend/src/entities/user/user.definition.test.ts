import { describe, expect, it } from 'vitest'
import { userDefinition } from './user.definition'

const credentialRules = (userDefinition.crossValidations ?? []).filter(
    (rule) => rule.fields.includes('email') && rule.fields.includes('username'),
)

const steps = (mode: 'create' | 'update') =>
    typeof userDefinition.wizard!.steps === 'function'
        ? userDefinition.wizard!.steps(mode)
        : userDefinition.wizard!.steps

describe('user entity credentials', () => {
    it('reports a missing email/username pair on both fields', () => {
        expect(credentialRules.map((rule) => rule.path)).toEqual(['email', 'username'])
    })

    it.each([
        [{ email: 'ada@opencelium.io', username: '' }, true],
        [{ email: '', username: 'ada' }, true],
        [{ email: '', username: '   ' }, false],
        [{ email: null, username: null }, false],
    ])('validates %o as %s', (values, expected) => {
        expect(credentialRules.every((rule) => rule.validate(values))).toBe(expected)
    })

    // entityResolver only runs a cross-validation when every field it names is part of
    // the step being validated, so the rule is dead unless both stay on the step.
    it.each(['create', 'update'] as const)('validates both credentials on the %s step', (mode) => {
        const credentialsStep = steps(mode).find((step) => step.id === 'credentials')
        expect(credentialsStep?.validateFields).toEqual(expect.arrayContaining(['email', 'username']))
    })

    it('keeps neither credential required on its own', () => {
        const required = ['email', 'username'].map(
            (name) => userDefinition.fields.find((field) => field.name === name)?.validation?.required,
        )
        expect(required).toEqual([false, false])
    })

    it('validates the email format and caps both fields at 255 characters', () => {
        const email = userDefinition.fields.find((field) => field.name === 'email')
        const username = userDefinition.fields.find((field) => field.name === 'username')
        expect(email?.validation?.email).toBe(true)
        expect(email?.validation?.max).toBe(255)
        expect(username?.validation?.max).toBe(255)
    })

    it('lists both credentials as sortable, searchable columns', () => {
        const columns = ['email', 'username'].map(
            (name) => userDefinition.fields.find((field) => field.name === name)?.table,
        )
        columns.forEach((column) => {
            expect(column?.visible).toBe(true)
            expect(column?.sortable).toBe(true)
            expect(column?.searchable).toBe(true)
        })
    })
})
