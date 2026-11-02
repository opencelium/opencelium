import { describe, expect, it } from 'vitest'
import type { WorkflowNodeModel } from '@features/workflow/types/workflow.types'
import { resolveTransformationNode } from './transformationTarget'

const node = (id: string, name: string, body: unknown = {}, selected = false) => ({
    id, type: 'connector', position: { x: 0, y: 0 }, selected,
    data: { title: 'CRM', subtitle: name, kind: 'connector', methodConfig: { name, body, headers: {} } },
}) as unknown as WorkflowNodeModel
const edge = (source: string, target: string) => ({ id: `${source}-${target}`, source, target })
const REF = '#FFCFB5.(response).body.$.name'

describe('resolveTransformationNode', () => {
    const plain = node('a', 'getCustomers', { name: 'x' })
    const mapped = node('b', 'createClient', { client: { title: '', name: REF } })
    const edges = [edge('a', 'b')] as never

    it('prefers a method whose body holds a reference, and points at that field', () => {
        expect(resolveTransformationNode([plain, mapped], edges, 'body')).toEqual({ kind: 'found', nodeId: 'b', label: 'createClient', field: 'name' })
    })

    it('takes the selected method when it has one', () => {
        const other = node('c', 'updateClient', { id: REF }, true)
        expect(resolveTransformationNode([plain, mapped, other], [...edges, edge('b', 'c')] as never, 'body')).toMatchObject({ nodeId: 'c', field: 'id' })
    })

    it('shows a named method even without a reference, for the guide to explain', () => {
        expect(resolveTransformationNode([plain, mapped], edges, 'body', 'get customers')).toMatchObject({ nodeId: 'a', field: null })
    })

    it('says so when no method has a reference to transform', () => {
        expect(resolveTransformationNode([plain], [], 'body')).toEqual({ kind: 'no-references' })
        expect(resolveTransformationNode([plain, mapped], edges, 'header')).toEqual({ kind: 'no-references' })
    })
})
