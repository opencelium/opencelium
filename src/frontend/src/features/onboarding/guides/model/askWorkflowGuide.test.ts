import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const gateway = vi.hoisted(() => ({ requests: [] as unknown[], answer: null as unknown, isDown: false }))
vi.mock('@features/ai-assistant/api/aiApi', () => ({
    aiApi: { endpoints: { routeGuide: { initiate: (body: unknown) => body } } },
}))
vi.mock('@app/store/store', () => ({
    store: {
        dispatch: (body: unknown) => {
            gateway.requests.push(body)
            return { unwrap: async () => { if (gateway.isDown) throw new Error('down'); return gateway.answer } }
        },
    },
}))
vi.mock('@shared/ui/feedback/notifyError', () => ({ notifyError: vi.fn() }))
vi.mock('@shared/i18n/config/i18n', () => ({
    i18n: { language: 'en', getFixedT: (language: string) => (key: string) => key.endsWith('Try') ? `${language} try` : key },
}))

import type { WorkflowNodeModel } from '@features/workflow/types/workflow.types'
import { workflowCommandBridgeStore } from '@features/workflow/command/workflowCommandBridge'
import { askWorkflowGuide } from './askWorkflowGuide'
import { useWorkflowGuideStore } from './workflowGuide.store'

const method = (id: string, label: string, operation: string) => ({
    id, type: 'connector', position: { x: 0, y: 0 },
    data: { title: 'CRM', subtitle: label, kind: 'connector', methodConfig: { name: operation } },
}) as unknown as WorkflowNodeModel

describe('askWorkflowGuide', () => {
    beforeEach(() => {
        gateway.requests = []
        gateway.isDown = false
        workflowCommandBridgeStore.setState({
            isActive: true,
            getNodes: () => [method('a', 'Fetch customers', 'getCustomers'), method('b', 'createClient', 'createClient')],
            getEdges: () => [],
            centerOnNode: vi.fn(),
        })
    })
    afterEach(() => {
        workflowCommandBridgeStore.setState({ isActive: false })
        useWorkflowGuideStore.setState({ active: null })
    })

    it('sends every guide in both languages and every name a method goes by', async () => {
        gateway.answer = { guideId: null, method: '' }
        await askWorkflowGuide('where is the body')
        expect(gateway.requests[0]).toMatchObject({
            prompt: 'where is the body',
            methods: ['Fetch customers', 'getCustomers', 'createClient'],
        })
        const guides = (gateway.requests[0] as { guides: { id: string; description: string }[] }).guides
        expect(guides.map(guide => guide.id)).toEqual(['method-url', 'method-headers', 'method-body', 'method-try'])
        expect(guides[3]?.description).toBe('en try · de try')
    })

    it('starts the guide on the method the gateway names', async () => {
        gateway.answer = { guideId: 'method-headers', method: 'createClient' }
        expect(await askWorkflowGuide('headers of create client')).toBe('started')
        expect(useWorkflowGuideStore.getState().active).toMatchObject({ guideId: 'method-headers', nodeId: 'b' })
    })

    it('reports a request no guide answers', async () => {
        gateway.answer = { guideId: null, method: '' }
        expect(await askWorkflowGuide('order a pizza')).toBe('no-guide')
    })

    it('ignores a guide this frontend does not know', async () => {
        gateway.answer = { guideId: 'method-response', method: '' }
        expect(await askWorkflowGuide('show the response')).toBe('no-guide')
    })

    it('reports a gateway that does not answer', async () => {
        gateway.isDown = true
        expect(await askWorkflowGuide('where is the body')).toBe('failed')
    })

    it('does not call the gateway outside the editor', async () => {
        workflowCommandBridgeStore.setState({ isActive: false })
        expect(await askWorkflowGuide('where is the body')).toBe('unavailable')
        expect(gateway.requests).toEqual([])
    })
})
