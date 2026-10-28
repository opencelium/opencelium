import { describe, expect, it } from 'vitest'
import { normalizeCondition } from '../src/dsl/normalizeCondition.ts'
import { normalizeWorkflow } from '../src/dsl/normalizeWorkflow.ts'
import { validateWorkflow } from '../src/dsl/validateWorkflow.ts'
import type { Condition, WorkflowDsl } from '../src/dsl/workflowDsl.schema.ts'
import { connectors } from './fixtures.ts'

const ref = (step: string, path: string) => ({ ref: { step, path } })
const literal = (text: string) => ({ literal: text })

describe('normalizeCondition', () => {
    it('clears the right side of exists / empty, where a ref would read as a comparison', () => {
        expect(normalizeCondition({ left: ref('s1', 'result'), op: 'empty', right: ref('s1', 'result') }))
            .toEqual({ left: ref('s1', 'result'), op: 'empty', right: literal('') })
    })

    it('turns = "" and != "" into the empty and exists tests', () => {
        expect(normalizeCondition({ left: ref('s1', 'state'), op: 'eq', right: literal(' ') }).op).toBe('empty')
        expect(normalizeCondition({ left: ref('s1', 'state'), op: 'ne', right: literal('') }).op).toBe('exists')
    })

    it('moves the step value to the left, flipping gt / lt', () => {
        expect(normalizeCondition({ left: literal('Closed'), op: 'eq', right: ref('s1', 'state') }))
            .toEqual({ left: ref('s1', 'state'), op: 'eq', right: literal('Closed') })
        expect(normalizeCondition({ left: literal('5'), op: 'gt', right: ref('s1', 'count') }))
            .toEqual({ left: ref('s1', 'count'), op: 'lt', right: literal('5') })
    })

    it('leaves sound conditions and a fixed list on the left alone', () => {
        const sound: Condition = { left: ref('s1', 'state'), op: 'eq', right: literal('Closed') }
        expect(normalizeCondition(sound)).toBe(sound)
        const fixedList: Condition = { left: literal('a,b'), op: 'contains', right: ref('s1', 'state') }
        expect(normalizeCondition(fixedList)).toBe(fixedList)
    })
})

const ifOver = (condition: Condition, inLoop = false): WorkflowDsl => {
    const check = { id: 's3', kind: 'if' as const, condition, then: [] }
    return {
        steps: [
            { id: 's1', kind: 'method', connector: 'from', operation: 'ListIssues', params: [], fields: [] },
            inLoop ? { id: 's2', kind: 'loop', over: { step: 's1', path: 'issues' }, body: [check] } : check,
        ],
    }
}
const errorsOf = (dsl: WorkflowDsl) =>
    validateWorkflow(normalizeWorkflow(dsl), connectors).filter((issue) => issue.severity === 'error').map((issue) => issue.message)

describe('condition checks', () => {
    it('rejects a condition between two fixed values', () => {
        expect(errorsOf(ifOver({ left: literal('a'), op: 'eq', right: literal('b') }))).toEqual([
            expect.stringContaining('compares two fixed values'),
        ])
    })

    it('rejects contains on a single declared value, and accepts it on a list', () => {
        expect(errorsOf(ifOver({ left: ref('s2', 'key'), op: 'contains', right: literal('OC') }, true))).toEqual([
            expect.stringContaining('is a single value'),
        ])
        expect(errorsOf(ifOver({ left: ref('s1', 'issues.key'), op: 'contains', right: literal('OC-1') }))).toEqual([])
        expect(errorsOf(ifOver({ left: ref('s1', 'issues'), op: 'not_contains', right: literal('OC-1') }))).toEqual([])
    })

    it('does not guess about paths the invoker does not declare', () => {
        expect(errorsOf(ifOver({ left: ref('s2', 'labels'), op: 'contains', right: literal('bug') }, true))).toEqual([])
    })

    it('runs the rewrite when the workflow is normalized', () => {
        const [, check] = normalizeWorkflow(ifOver({ left: literal('Closed'), op: 'ne', right: ref('s1', 'issues.key') })).steps
        expect(check).toMatchObject({ condition: { left: ref('s1', 'issues.key'), op: 'ne', right: literal('Closed') } })
    })
})
