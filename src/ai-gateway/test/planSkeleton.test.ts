import { describe, expect, it } from 'vitest'
import { toJsonSchema } from '../src/dsl/buildConstrainedSchema.ts'
import { buildSkeleton, buildSkeletonSchema, describeSkeleton } from '../src/plan/planSkeleton.ts'
import { parsePlanText } from '../src/plan/renderPlanForBuild.ts'
import { connectors, validWorkflow } from './fixtures.ts'

const plan = parsePlanText(`- Read the issues with ListIssues.
- For each issue (loop over the ListIssues result):
  - If the issue priority is High: create it with CreateTicket.
- Create sets: title = issue summary.`)

describe('buildSkeleton', () => {
    const skeleton = buildSkeleton(plan, connectors)

    it('fixes kinds, operations, loop sources and nesting from the plan, keeping other lines as notes', () => {
        expect(skeleton.notes).toEqual(['Create sets: title = issue summary.'])
        expect(skeleton.nodes).toMatchObject([
            { id: 's1', kind: 'method', op: { side: 'from', operation: { name: 'ListIssues' } } },
            { id: 's2', kind: 'loop', sourceId: 's1', body: [
                { id: 's3', kind: 'if', then: [{ id: 's4', kind: 'method', op: { side: 'to', operation: { name: 'CreateTicket' } } }] },
            ] },
        ])
    })

    it('treats later operation names on a step line as references, not as extra steps', () => {
        const steps = parsePlanText('- Read with ListIssues.\n- Create with CreateTicket using the ListIssues result.')
        expect(buildSkeleton(steps, connectors).nodes.map((node) => node.kind === 'method' && node.op.operation.name))
            .toEqual(['ListIssues', 'CreateTicket'])
    })

    it('keeps a field instruction as a note even when it names an operation', () => {
        const steps = parsePlanText('- Read with ListIssues.\n- Create with CreateTicket.\n- CreateTicket also sets title = the ListIssues key.')
        const skeleton = buildSkeleton(steps, connectors)
        expect(skeleton.nodes.map((node) => node.id)).toEqual(['s1', 's2'])
        expect(skeleton.notes).toEqual(['CreateTicket also sets title = the ListIssues key.'])
    })

    it('refuses a plan whose loop does not name the operation it goes over, or that names no operation', () => {
        expect(() => buildSkeleton(parsePlanText('- Read with ListIssues.\n- For each thing: create it with CreateTicket.'), connectors))
            .toThrow(/does not name the operation/)
        expect(() => buildSkeleton(parsePlanText('- Do something useful.'), connectors)).toThrow(/does not name any operation/)
    })

    it('builds a schema that accepts the skeleton\'s shape only', () => {
        const schema = buildSkeletonSchema(skeleton)
        const filled = { steps: [
            { id: 's1', kind: 'method', connector: 'from', operation: 'ListIssues', params: [], fields: [] },
            { id: 's2', kind: 'loop', over: { step: 's1', path: 'issues' }, body: [{
                id: 's3', kind: 'if', condition: { left: { ref: { step: 's2', path: 'fields.priority.name' } }, op: 'eq', right: { literal: 'High' } },
                then: [{ id: 's4', kind: 'method', connector: 'to', operation: 'CreateTicket', params: [], fields: [] }],
            }] },
        ] }
        expect(schema.safeParse(filled).success).toBe(true)
        expect(schema.safeParse(validWorkflow).success).toBe(false)
        expect(JSON.stringify(toJsonSchema(schema))).not.toContain('"items":false')
    })

    it('tells the model which steps are fixed and what to fill in', () => {
        const message = describeSkeleton('Sync issues', skeleton)
        expect(message).toContain('s2: loop over the ListIssues result of s1')
        expect(message).toContain('    s4: method CreateTicket (connector "to")')
        expect(message).toContain('- Create sets: title = issue summary.')
    })
})
