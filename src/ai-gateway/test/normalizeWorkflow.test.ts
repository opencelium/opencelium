import { describe, expect, it } from 'vitest'
import { normalizeWorkflow } from '../src/dsl/normalizeWorkflow.ts'
import { validateWorkflow } from '../src/dsl/validateWorkflow.ts'
import type { WorkflowDsl } from '../src/dsl/workflowDsl.schema.ts'
import { connectors } from './fixtures.ts'

const create = (id: string, step: string) => ({
    id, kind: 'method' as const, connector: 'to' as const, operation: 'CreateTicket', params: [],
    fields: [{ name: 'title', value: { ref: { step, path: 'fields.summary' } } }],
})

/** The shape a real run produced: s2 iterates issues, a later loop iterates s2 and reads s2's element. */
const reusedLoop: WorkflowDsl = {
    steps: [
        { id: 's1', kind: 'method', connector: 'from', operation: 'ListIssues', params: [], fields: [] },
        { id: 's2', kind: 'loop', over: { step: 's1', path: 'issues[]' }, body: [] },
        {
            id: 's3', kind: 'if',
            condition: { left: { ref: { step: 's1', path: 'issues' } }, op: 'exists', right: { literal: '' } },
            then: [{ id: 's4', kind: 'loop', over: { step: 's2', path: '' }, body: [create('s5', 's2')] }],
        },
    ],
}

describe('normalizeWorkflow', () => {
    it('points a loop over a finished loop at that loop\'s source array, and moves element reads to it', () => {
        expect(validateWorkflow(reusedLoop, connectors).filter((issue) => issue.severity === 'error')).toHaveLength(2)
        const normalized = normalizeWorkflow(reusedLoop)
        const outer = normalized.steps[2]
        if (outer?.kind !== 'if' || outer.then[0]?.kind !== 'loop') throw new Error('shape changed')
        expect(outer.then[0].over).toEqual({ step: 's1', path: 'issues[]' })
        expect(outer.then[0].body[0]).toMatchObject({ fields: [{ value: { ref: { step: 's4', path: 'fields.summary' } } }] })
        expect(validateWorkflow(normalized, connectors)).toEqual([])
    })

    it('also treats a loop over the ended loop\'s own path as the same list again', () => {
        const dsl = structuredClone(reusedLoop)
        const outer = dsl.steps[2]
        if (outer?.kind !== 'if' || outer.then[0]?.kind !== 'loop') throw new Error('shape changed')
        outer.then[0].over = { step: 's2', path: 'issues' }
        expect(validateWorkflow(normalizeWorkflow(dsl), connectors)).toEqual([])
    })

    it('drops a field assignment when a deeper path under it is assigned too', () => {
        const dsl: WorkflowDsl = { steps: [{
            id: 's1', kind: 'method', connector: 'to', operation: 'CreateTicket', params: [],
            fields: [
                { name: 'article', value: { literal: '{}' } },
                { name: 'article.body', value: { literal: 'text' } },
                { name: 'title', value: { literal: 'T' } },
            ],
        }] }
        const [step] = normalizeWorkflow(dsl).steps
        expect(step?.kind === 'method' && step.fields.map((field) => field.name)).toEqual(['article.body', 'title'])
    })

    it('leaves valid workflows unchanged', () => {
        const valid: WorkflowDsl = {
            steps: [
                { id: 's1', kind: 'method', connector: 'from', operation: 'ListIssues', params: [], fields: [] },
                { id: 's2', kind: 'loop', over: { step: 's1', path: 'issues' }, body: [create('s3', 's2')] },
            ],
        }
        expect(normalizeWorkflow(valid)).toEqual(valid)
    })

    it('does not guess when no enclosing loop iterates the same array', () => {
        const stray: WorkflowDsl = {
            steps: [
                { id: 's1', kind: 'method', connector: 'from', operation: 'ListIssues', params: [], fields: [] },
                { id: 's2', kind: 'loop', over: { step: 's1', path: 'issues' }, body: [] },
                create('s3', 's2'),
            ],
        }
        expect(normalizeWorkflow(stray)).toEqual(stray)
        expect(validateWorkflow(stray, connectors)).toEqual([expect.objectContaining({
            stepId: 's3', severity: 'error',
            message: expect.stringContaining('put these steps inside a new loop with "over": {"step":"s1","path":"issues"}'),
        })])
    })
})
