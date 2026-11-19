import { describe, expect, it } from 'vitest'
import { detectRefs, parameterProblems, refTypeOf, uniqueRefs } from './script'

describe('script refs', () => {
    it('finds literal refs with their type and position', () => {
        const code = 'var id = ref("${ticketId}");\nvar t = ref(\'{tenant}\') + ref("{{global.tz}}");\nvar h = ref("#FFCF00.(response).host");'
        const { refs, nonLiteral } = detectRefs(code)
        expect(refs.map(({ ref, type, line, column }) => ({ ref, type, line, column }))).toEqual([
            { ref: '${ticketId}', type: 'WEBHOOK', line: 1, column: 10 },
            { ref: '{tenant}', type: 'REQUEST_DATA', line: 2, column: 9 },
            { ref: '{{global.tz}}', type: 'GLOBAL', line: 2, column: 27 },
            { ref: '#FFCF00.(response).host', type: 'METHOD_RESPONSE', line: 3, column: 9 },
        ])
        expect(refs[3].warning).toBe('TIED_TO_CALLER_COLORS')
        expect(nonLiteral).toEqual([])
    })

    it('flags ref() calls that are not a string literal', () => {
        expect(detectRefs('var x = ref(name);\nvar y = ref("${" + a + "}");').nonLiteral)
            .toEqual([{ line: 1, column: 9 }, { line: 2, column: 9 }])
    })

    it('types refs and drops duplicates', () => {
        expect(refTypeOf('@{page}')).toBe('PAGE')
        expect(uniqueRefs(detectRefs('ref("{a}"); ref("{a}");').refs)).toHaveLength(1)
    })

    it('checks parameter names', () => {
        expect(parameterProblems([{ name: 'a', required: true, defaultText: '' }])).toBeNull()
        expect(parameterProblems([{ name: '1a', required: true, defaultText: '' }])).toBe('invalidName')
        expect(parameterProblems([
            { name: 'a', required: true, defaultText: '' }, { name: 'a ', required: false, defaultText: '' },
        ])).toBe('duplicateName')
    })
})
