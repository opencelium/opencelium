import { describe, expect, it } from 'vitest'
import type { WorkflowEdgeModel, WorkflowNodeModel } from '@features/workflow/types/workflow.types'
import { resolveGuideNode } from './resolveGuideNode'

const node = (id: string, type: 'start' | 'connector' | 'loop', name: string, x: number, y = 0, selected = false) => ({
    id, type, selected, position: { x, y },
    data: { title: type === 'connector' ? 'CRM' : name, subtitle: type === 'connector' ? name : undefined, kind: type },
}) as unknown as WorkflowNodeModel

const edge = (source: string, target: string, sourceHandle?: string, targetHandle?: string) => ({
    id: `${source}-${target}`, source, target, sourceHandle, targetHandle, type: 'workflow-edge',
}) as WorkflowEdgeModel

// start → getCustomers (0) → loop (1) ⤵ getCustomers (1_0); loop → createClient (2); a loose getCustomers last.
const start = node('start-1', 'start', 'Start', 0)
const first = node('a', 'connector', 'getCustomers', 200)
const loop = node('loop', 'loop', 'Loop', 400)
const inLoop = node('b', 'connector', 'getCustomers', 400, 200)
const after = node('c', 'connector', 'createClient', 600)
const loose = node('d', 'connector', 'getCustomers', 900, 900)
const edges = [
    edge('start-1', 'a'), edge('a', 'loop'), edge('loop', 'b', 'bottom', 'top'), edge('loop', 'c', 'right', 'left'),
]
// Shuffled on purpose: the answer must come from the tree, not from array order.
const nodes = [loose, after, inLoop, loop, first, start]

const select = (target: WorkflowNodeModel) => nodes.map(item => item === target ? { ...item, selected: true } as WorkflowNodeModel : item)

describe('resolveGuideNode', () => {
    it('takes the first match in tree order when a method is named', () => {
        expect(resolveGuideNode(nodes, edges, 'getCustomers')).toEqual({ kind: 'found', nodeId: 'a', label: 'getCustomers' })
    })

    it('matches a spoken name with spaces and different case', () => {
        expect(resolveGuideNode(nodes, edges, 'Create Client')).toMatchObject({ kind: 'found', nodeId: 'c' })
    })

    it('prefers an exact name over a partial one', () => {
        const getNode = node('e', 'connector', 'get', 1000, 1000)
        expect(resolveGuideNode([...nodes, getNode], edges, 'get')).toMatchObject({ nodeId: 'e' })
    })

    it('falls back to a partial name', () => {
        expect(resolveGuideNode(nodes, edges, 'client')).toMatchObject({ nodeId: 'c' })
    })

    it('ignores the selection when a method is named', () => {
        expect(resolveGuideNode(select(after), edges, 'getCustomers')).toMatchObject({ nodeId: 'a' })
    })

    it('uses the selected method when none is named', () => {
        expect(resolveGuideNode(select(inLoop), edges)).toMatchObject({ nodeId: 'b' })
    })

    it('uses the first method in the tree when none is named or selected', () => {
        expect(resolveGuideNode(nodes, edges)).toMatchObject({ nodeId: 'a' })
    })

    it('does not count a selected operator as the selected method', () => {
        expect(resolveGuideNode(select(loop), edges)).toMatchObject({ nodeId: 'a' })
    })

    it('reports a named method that is not in the workflow', () => {
        expect(resolveGuideNode(nodes, edges, ' updateTicket ')).toEqual({ kind: 'no-match', method: 'updateTicket' })
    })

    it('reports a workflow without methods', () => {
        expect(resolveGuideNode([start, loop], edges, 'getCustomers')).toEqual({ kind: 'no-methods' })
    })
})
