import { describe, expect, it } from 'vitest'
import { detectImpureCalls, parameterProblems } from './script'

describe('impure calls', () => {
    it('finds ref() and set() calls with their position', () => {
        expect(detectImpureCalls('var id = ref("${ticketId}");\nset("{{global.x}}", 1);'))
            .toEqual([{ line: 1, column: 10 }, { line: 2, column: 1 }])
    })

    it('leaves other names and methods alone', () => {
        expect(detectImpureCalls('var preference = 1; map.set(a, b); offset(2); return prefs(1);')).toEqual([])
    })

    it('accepts ref without parentheses only in Ruby', () => {
        expect(detectImpureCalls('t = ref "{tenant}"', 'ruby')).toEqual([{ line: 1, column: 5 }])
        expect(detectImpureCalls('t = ref "{tenant}"', 'js')).toEqual([])
    })
})

describe('parameters', () => {
    it('checks parameter names', () => {
        expect(parameterProblems([{ name: 'a', description: '', required: true, defaultText: '' }])).toBeNull()
        expect(parameterProblems([{ name: '1a', description: '', required: true, defaultText: '' }])).toBe('invalidName')
        expect(parameterProblems([
            { name: 'a', description: '', required: true, defaultText: '' }, { name: 'a ', description: '', required: false, defaultText: '' },
        ])).toBe('duplicateName')
    })
})
