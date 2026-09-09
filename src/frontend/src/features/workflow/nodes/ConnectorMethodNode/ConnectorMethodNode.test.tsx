import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

// Pulls a live connector-status query; the node's identity is what is under test.
vi.mock('./ConnectorMethodNodeContent', () => ({ ConnectorMethodNodeContent: () => null }))
vi.mock('@xyflow/react', () => ({
    Handle: () => null,
    Position: { Top: 'top', Right: 'right', Bottom: 'bottom', Left: 'left' },
}))

import { ConnectorMethodNode } from './ConnectorMethodNode'
import type { ConnectorWorkflowNode, WorkflowNodeData } from '../../types/workflow.types'

type Props = Parameters<typeof ConnectorMethodNode>[0]

const renderNode = (data: Partial<WorkflowNodeData>) => {
    const props = {
        id: 'n1',
        data: { title: 'Tutorial CRM', subtitle: 'getCustomers', kind: 'connector', ...data },
        selected: false,
        dragging: false,
    } as unknown as Props
    return render(<ConnectorMethodNode {...props} />)
}

describe('ConnectorMethodNode', () => {
    // The tutorial addresses a placed step by the method it runs. `title` holds the
    // *connector*, so deriving the id from it silently produced
    // `workflow-node-method-tutorial-crm` and every selector aimed at a method missed.
    it('identifies itself by the method it runs, not the connector it belongs to', () => {
        const view = renderNode({})
        expect(view.container.querySelector('[data-testid="workflow-node-method-getcustomers"]')).not.toBeNull()
        expect(view.container.querySelector('[data-testid="workflow-node-method-tutorial-crm"]')).toBeNull()
    })

    it('names itself after whatever it labels itself with', () => {
        const view = renderNode({ subtitle: 'createClient' })
        expect(view.container.querySelector('[data-testid="workflow-node-method-createclient"]')).not.toBeNull()
        expect(view.container.textContent).toContain('createClient')
    })

    it('falls back to the title when there is no method name', () => {
        const view = renderNode({ subtitle: undefined })
        expect(view.container.querySelector('[data-testid="workflow-node-method-tutorial-crm"]')).not.toBeNull()
    })

    // The tutorial scopes its highlight to `<node> <trigger>`, so the trigger has to
    // be inside the element carrying the node's id.
    it('offers a right insertion point that can be addressed inside the node', () => {
        const view = renderNode({ isLeaf: true, onAddStep: vi.fn() } as Partial<ConnectorWorkflowNode['data']>)
        expect(view.container.querySelector(
            '[data-testid="workflow-node-method-getcustomers"] [data-testid="workflow-add-step-right"]',
        )).not.toBeNull()
    })
})
