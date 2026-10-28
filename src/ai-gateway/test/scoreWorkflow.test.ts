import { describe, expect, it } from 'vitest'
import { dslShape, scoreWorkflow, templateShape } from '../src/eval/scoreWorkflow.ts'
import type { WorkflowDsl } from '../src/dsl/workflowDsl.schema.ts'
import { connectors } from './fixtures.ts'

/** Issues to tickets: list, then create inside a loop; one call of an operation the installed Helpdesk no longer has. */
const template = {
    connection: {
        fromConnector: { invoker: { name: 'Tracker' }, operators: [],
            methods: [{ name: 'ListIssues', index: '0', color: '#A', request: { body: null } }] },
        toConnector: {
            invoker: { name: 'Helpdesk' },
            operators: [{ index: '0', type: 'loop', condition: { leftStatement: { color: '#A', field: 'success.issues[]' } } }],
            methods: [
                { name: 'CreateTicket', index: '0_0', color: '#C', request: { body: { fields: { article: { body: 'fixed' } } } } },
                { name: 'GoneOperation', index: '0_1', color: '#D', request: { body: null } },
            ],
        },
        fieldBinding: [{ from: [{ color: '#A', field: 'success.issues[i].fields.summary' }], to: [{ color: '#C', field: 'title' }] }],
    },
}

const method = (id: string, connector: 'from' | 'to', operation: string, fields: string[] = []) => ({
    id, kind: 'method' as const, connector, operation, params: [],
    fields: fields.map((name) => ({ name, value: { literal: 'x' } })),
})

describe('templateShape', () => {
    it('reads operations, their placement and the fields set, skipping operations that no longer exist', () => {
        const shape = templateShape(template, connectors)
        expect([...shape.operations]).toEqual(['from:ListIssues', 'to:CreateTicket'])
        expect([...shape.placements]).toEqual(['from:ListIssues@', 'to:CreateTicket@loop'])
        expect([...shape.fields].sort()).toEqual(['to:CreateTicket article.body', 'to:CreateTicket title'])
    })
})

describe('scoreWorkflow', () => {
    const truth = templateShape(template, connectors)

    it('scores a faithful rebuild fully, ignoring the JSON-RPC envelope', () => {
        const dsl: WorkflowDsl = { steps: [
            method('s1', 'from', 'ListIssues'),
            { id: 's2', kind: 'loop', over: { step: 's1', path: 'issues' },
                body: [method('s3', 'to', 'CreateTicket', ['title', 'article.body', 'method'])] },
        ] }
        expect(scoreWorkflow(truth, dslShape(dsl))).toEqual({
            operationRecall: 1, operationPrecision: 1, placementRecall: 1, fieldRecall: 1, fieldPrecision: 1,
        })
    })

    it('counts a call outside its loop as a placement miss and an unasked field against precision', () => {
        const dsl: WorkflowDsl = { steps: [method('s1', 'from', 'ListIssues'), method('s2', 'to', 'CreateTicket', ['title', 'priority'])] }
        expect(scoreWorkflow(truth, dslShape(dsl))).toEqual({
            operationRecall: 1, operationPrecision: 1, placementRecall: 0.5, fieldRecall: 0.5, fieldPrecision: 0.5,
        })
    })
})
