import { describe, expect, it } from 'vitest'
import { buildConstrainedSchema } from '../src/dsl/buildConstrainedSchema.ts'
import { extendsDeclaredObject } from '../src/invokers/fieldPaths.ts'
import { buildSkeleton, buildSkeletonSchema } from '../src/plan/planSkeleton.ts'
import { parsePlanText } from '../src/plan/renderPlanForBuild.ts'
import { connectors } from './fixtures.ts'

const declared = [
    { path: 'ConfigItem', type: 'object' },
    { path: 'ConfigItem.Name', type: 'string' },
    { path: 'ConfigItem.CIXMLData', type: 'object' },
    { path: 'ConfigItem.CIXMLData.Vendor', type: 'string' },
    { path: 'Tags[]', type: 'array' },
]

describe('extendsDeclaredObject', () => {
    it.each([
        ['ConfigItem.CIXMLData.IdoitObjectID', true],
        ['ConfigItem.CIXMLData.Contact1.FirstName', true],
        ['ConfigItem.Version', true],
        ['ConfigItem.CIXMLData.Vendor', false],
        ['ConfigItem.Name.First', false],
        ['Tags[].Label', false],
        ['Priority', false],
        ['ConfigItem.CIXMLData.bad name', false],
    ])('%s → %s', (path, expected) => {
        expect(extendsDeclaredObject(declared, path)).toBe(expected)
    })
})

describe('plan fields below declared objects', () => {
    const skeleton = buildSkeleton(parsePlanText(`- Read the issues with ListIssues.
- For each issue (loop over the ListIssues result): create it with CreateTicket.
- CreateTicket set title = item fields.summary; article.author = item key; title.prefix = "x"; priority = "High"`), connectors)
    const ticket = (fields: { name: string; value: unknown }[]) => ({ steps: [
        { id: 's1', kind: 'method', connector: 'from', operation: 'ListIssues', params: [], fields: [] },
        { id: 's2', kind: 'loop', over: { step: 's1', path: 'issues' }, body: [
            { id: 's3', kind: 'method', connector: 'to', operation: 'CreateTicket', params: [], fields },
        ] },
    ] })
    const key = { ref: { step: 's2', path: 'key' } }

    it('become settable when the plan names them under a declared object', () => {
        expect(buildSkeletonSchema(skeleton).safeParse(ticket([{ name: 'article.author', value: key }])).success).toBe(true)
    })

    it('stay rejected under a text field, as new top-level fields, and in builds without a plan', () => {
        const schema = buildSkeletonSchema(skeleton)
        expect(schema.safeParse(ticket([{ name: 'title.prefix', value: { literal: 'x' } }])).success).toBe(false)
        expect(schema.safeParse(ticket([{ name: 'priority', value: { literal: 'High' } }])).success).toBe(false)
        expect(buildConstrainedSchema(connectors).safeParse(ticket([{ name: 'article.author', value: key }])).success).toBe(false)
    })
})
