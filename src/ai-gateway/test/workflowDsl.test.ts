import { describe, expect, it } from 'vitest'
import { buildConstrainedSchema, toJsonSchema } from '../src/dsl/buildConstrainedSchema.ts'
import { validateWorkflow } from '../src/dsl/validateWorkflow.ts'
import { type WorkflowDsl, workflowDslSchema } from '../src/dsl/workflowDsl.schema.ts'
import { connectors, validWorkflow } from './fixtures.ts'

const constrained = buildConstrainedSchema(connectors)

function withFirstStep(patch: Record<string, unknown>) {
    return { steps: [{ ...validWorkflow.steps[0], ...patch }, ...validWorkflow.steps.slice(1)] }
}

describe('buildConstrainedSchema', () => {
    it('accepts a valid workflow, which also parses with the static schema', () => {
        expect(constrained.safeParse(validWorkflow).success).toBe(true)
        expect(workflowDslSchema.safeParse(validWorkflow).success).toBe(true)
    })

    it('rejects an operation that does not exist', () => {
        expect(constrained.safeParse(withFirstStep({ operation: 'DeleteEverything' })).success).toBe(false)
    })

    it('rejects an operation on the connector that does not own it', () => {
        expect(constrained.safeParse(withFirstStep({ connector: 'to' })).success).toBe(false)
    })

    it('rejects params the endpoint does not declare, such as connector settings', () => {
        const step = withFirstStep({ params: [{ name: 'url', value: { literal: 'https://x' } }] })
        expect(constrained.safeParse(step).success).toBe(false)
    })

    it('rejects body fields on an operation without a request body', () => {
        const step = withFirstStep({ fields: [{ name: 'title', value: { literal: 'x' } }] })
        expect(constrained.safeParse(step).success).toBe(false)
    })

    it('rejects body fields the connector fills from its credentials', () => {
        const dsl = structuredClone(validWorkflow)
        const loop = dsl.steps[1] as { body: { fields: unknown[] }[] }
        loop.body[0]?.fields.push({ name: 'apikey', value: { literal: '<your_api_key>' } })
        expect(constrained.safeParse(dsl).success).toBe(false)
    })

    it('exports a recursive JSON schema with shared definitions', () => {
        const json = toJsonSchema(constrained)
        expect(json).toHaveProperty('$defs')
        expect(JSON.stringify(json)).toContain('"const":"CreateTicket"')
    })
})

describe('validateWorkflow', () => {
    it('finds no issues in a valid workflow', () => {
        expect(validateWorkflow(validWorkflow as WorkflowDsl, connectors)).toEqual([])
    })

    it('flags references to later steps and to non-enclosing loops as errors', () => {
        const dsl: WorkflowDsl = {
            steps: [
                {
                    id: 's1',
                    kind: 'method',
                    connector: 'to',
                    operation: 'CreateTicket',
                    params: [],
                    fields: [
                        { name: 'title', value: { ref: { step: 's2', path: 'issues' } } },
                        { name: 'article.body', value: { ref: { step: 's9', path: 'key' } } },
                    ],
                },
                { id: 's2', kind: 'method', connector: 'from', operation: 'ListIssues', params: [], fields: [] },
            ],
        }
        expect(validateWorkflow(dsl, connectors)).toEqual([
            expect.objectContaining({ stepId: 's1', severity: 'error', message: expect.stringContaining('"s2"') }),
            expect.objectContaining({ stepId: 's1', severity: 'error', message: expect.stringContaining('"s9"') }),
        ])
    })

    it('warns about response paths the invoker does not declare', () => {
        const dsl = structuredClone(validWorkflow) as WorkflowDsl
        const loop = dsl.steps[1]
        if (loop?.kind !== 'loop' || loop.body[0]?.kind !== 'method') throw new Error('fixture changed')
        loop.body[0].fields = [{ name: 'title', value: { ref: { step: 's2', path: 'fields.headline' } } }]
        expect(validateWorkflow(dsl, connectors)).toEqual([
            expect.objectContaining({ stepId: 's3', severity: 'warning' }),
        ])
    })

    it('rejects a ref to a loop that does not enclose the step', () => {
        const dsl = structuredClone(validWorkflow) as WorkflowDsl
        dsl.steps.push({
            id: 's4',
            kind: 'method',
            connector: 'to',
            operation: 'CreateTicket',
            params: [],
            fields: [{ name: 'title', value: { ref: { step: 's2', path: 'fields.summary' } } }],
        })
        expect(validateWorkflow(dsl, connectors)).toEqual([
            expect.objectContaining({ stepId: 's4', severity: 'error', message: expect.stringContaining('has already ended') }),
        ])
    })

    it('resolves a nested loop over an array inside the outer element', () => {
        const dsl: WorkflowDsl = {
            steps: [
                { id: 's1', kind: 'method', connector: 'from', operation: 'ListIssues', params: [], fields: [] },
                {
                    id: 's2',
                    kind: 'loop',
                    over: { step: 's1', path: 'issues' },
                    body: [
                        {
                            id: 's3',
                            kind: 'loop',
                            over: { step: 's2', path: 'fields' },
                            body: [
                                {
                                    id: 's4',
                                    kind: 'method',
                                    connector: 'to',
                                    operation: 'CreateTicket',
                                    params: [],
                                    fields: [{ name: 'title', value: { ref: { step: 's3', path: 'priority.name' } } }],
                                },
                            ],
                        },
                    ],
                },
            ],
        }
        expect(validateWorkflow(dsl, connectors)).toEqual([])
    })

    it('does not check the unused right side of a unary condition', () => {
        const dsl: WorkflowDsl = {
            steps: [
                { id: 's1', kind: 'method', connector: 'from', operation: 'ListIssues', params: [], fields: [] },
                { id: 's2', kind: 'if', then: [],
                    condition: { left: { ref: { step: 's1', path: 'issues' } }, op: 'empty', right: { ref: { step: 's9', path: 'x' } } } },
            ],
        }
        expect(validateWorkflow(dsl, connectors)).toEqual([])
    })

    it('flags duplicate step ids', () => {
        const dsl = structuredClone(validWorkflow) as WorkflowDsl
        const loop = dsl.steps[1]
        if (loop?.kind !== 'loop') throw new Error('fixture changed')
        loop.id = 's1'
        expect(validateWorkflow(dsl, connectors)).toContainEqual(
            expect.objectContaining({ severity: 'error', message: expect.stringContaining('more than once') }),
        )
    })
})
