import { describe, expect, it } from 'vitest'
import {
    areInvokerNamesEqual,
    isInvokerNameCharacterSetValid,
    isInvokerNameDotPlacementValid,
    isInvokerNameLengthValid,
    normalizeInvokerName,
} from './invokerName'

describe('invoker name validation', () => {
    it.each([
        'Invoker 1',
        'invoker-name_2',
        'Invoker (production)',
        'invoker.v2',
    ])('accepts valid name %s', (name) => {
        expect(isInvokerNameCharacterSetValid(name)).toBe(true)
        expect(isInvokerNameDotPlacementValid(name)).toBe(true)
    })

    it.each(['invoker@name', 'invoker/name', 'invoker#name'])('rejects invalid characters in %s', (name) => {
        expect(isInvokerNameCharacterSetValid(name)).toBe(false)
    })

    it.each(['.invoker', 'invoker.', 'invoker..name'])('rejects invalid period placement in %s', (name) => {
        expect(isInvokerNameDotPlacementValid(name)).toBe(false)
    })

    it('rejects names longer than 200 characters after trimming', () => {
        expect(isInvokerNameLengthValid('a'.repeat(200))).toBe(true)
        expect(isInvokerNameLengthValid(`  ${'a'.repeat(200)}  `)).toBe(true)
        expect(isInvokerNameLengthValid('a'.repeat(201))).toBe(false)
    })

    it('trims leading and trailing whitespace', () => {
        expect(normalizeInvokerName('  Invoker name  ')).toBe('Invoker name')
    })

    it('compares names case-insensitively and ignores surrounding whitespace', () => {
        expect(areInvokerNamesEqual(' My Invoker ', 'my invoker')).toBe(true)
    })
})
