import { describe, expect, it } from 'vitest'
import type { EnhancementScriptArg } from '@features/workflow/ai/enhancementScript.types'
import { generateEnhancementScript } from './generateEnhancementScript'

const arg = (name: string): EnhancementScriptArg => ({
    name, path: `body.$.${name.toLowerCase()}`, methodName: 'GetAllUser',
})

const base = { language: 'js' as const, resultPath: 'body.$.target' }

const gen = (instruction: string, args: EnhancementScriptArg[] = [arg('VAR_0')]) =>
    generateEnhancementScript({ ...base, intent: 'generate', instruction, args })

const fix = (script: string, args: EnhancementScriptArg[] = [arg('VAR_0')]) =>
    generateEnhancementScript({ ...base, intent: 'repair', script, args })

describe('generateEnhancementScript — generate', () => {
    it('assigns exactly once to RESULT_VAR and reads only declared inputs', () => {
        const { script } = gen('uppercase the name')

        expect(script.split('RESULT_VAR =')).toHaveLength(2)
        expect(script).toContain('VAR_0')
        expect(script).not.toContain('VAR_1')
    })

    it('joins several inputs when asked to combine them', () => {
        const { script } = gen('join first and last name', [arg('VAR_0'), arg('VAR_1')])

        expect(script).toBe("RESULT_VAR = VAR_0 + ' ' + VAR_1")
    })

    it('falls through to a narrower rule when the join needs more inputs than exist', () => {
        const { script } = gen('join the name', [arg('VAR_0')])

        expect(script).toBe('RESULT_VAR = VAR_0')
    })

    it('writes an ISO date when asked for one', () => {
        expect(gen('format as an ISO date').script)
            .toBe('RESULT_VAR = new Date(VAR_0).toISOString()')
    })

    it('understands a German instruction', () => {
        expect(gen('in Großbuchstaben').script).toBe('RESULT_VAR = String(VAR_0).toUpperCase()')
    })

    it('passes the value through when the instruction names no transform', () => {
        const result = gen('do the thing with the stuff')

        expect(result.script).toBe('RESULT_VAR = VAR_0')
        expect(result.summary).toMatch(/did not name a transform/)
    })

    it('writes a constant when the enhancement has no inputs at all', () => {
        expect(gen('uppercase it', []).script).toBe("RESULT_VAR = ''")
    })

    it('does not emit JavaScript for a non-JavaScript enhancement', () => {
        const result = generateEnhancementScript({
            ...base, language: 'python3', intent: 'generate',
            instruction: 'format as an ISO date', args: [arg('VAR_0')],
        })

        expect(result.script).not.toContain('new Date')
    })
})

describe('generateEnhancementScript — repair', () => {
    it('replaces the missing-input marker with an argument that still exists', () => {
        const result = fix('RESULT_VAR = VARIABLE_NOT_EXIST.trim()')

        expect(result.script).toBe('RESULT_VAR = VAR_0.trim()')
        expect(result.summary).toContain('VAR_0')
    })

    it('replaces every occurrence, not just the first', () => {
        const { script } = fix('RESULT_VAR = VARIABLE_NOT_EXIST + VARIABLE_NOT_EXIST')

        expect(script).toBe('RESULT_VAR = VAR_0 + VAR_0')
    })

    it('reduces the script to a constant when no inputs remain', () => {
        expect(fix('RESULT_VAR = VARIABLE_NOT_EXIST', []).script).toBe("RESULT_VAR = ''")
    })

    it('leaves a healthy script untouched', () => {
        const script = 'RESULT_VAR = VAR_0.trim()'

        expect(fix(script)).toMatchObject({ script, summary: expect.stringMatching(/nothing to repair/) })
    })
})
