import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const notifyError = vi.hoisted(() => vi.fn())
vi.mock('@shared/ui/feedback/notifyError', () => ({ notifyError }))
vi.mock('@shared/i18n/config/i18n', () => ({
    i18n: { language: 'en', getFixedT: () => (key: string, values?: Record<string, string>) => `${key}${values ? JSON.stringify(values) : ''}` },
}))

import type { WorkflowNodeModel } from '@features/workflow/types/workflow.types'
import { workflowCommandBridgeStore } from '@features/workflow/command/workflowCommandBridge'
import { useWorkflowTutorialStore } from '../../workflow-tutorial/model/workflowTutorial.store'
import { workflowGuideCommand } from '../command/workflowGuideCommand'
import { startWorkflowGuide } from './startWorkflowGuide'
import { useWorkflowGuideStore } from './workflowGuide.store'

const method = { id: 'm1', type: 'connector', position: { x: 0, y: 0 }, data: { title: 'CRM', subtitle: 'getCustomers', kind: 'connector' } } as unknown as WorkflowNodeModel
const centerOnNode = vi.fn()

describe('startWorkflowGuide', () => {
    beforeEach(() => {
        workflowCommandBridgeStore.setState({ isActive: true, getNodes: () => [method], getEdges: () => [], centerOnNode })
    })
    afterEach(() => {
        workflowCommandBridgeStore.setState({ isActive: false })
        useWorkflowGuideStore.setState({ active: null })
        useWorkflowTutorialStore.setState({ requested: false })
        vi.clearAllMocks()
    })

    it('centres the method and starts the guide', () => {
        startWorkflowGuide('method-headers', 'get customers')
        expect(centerOnNode).toHaveBeenCalledWith('m1')
        expect(useWorkflowGuideStore.getState().active).toEqual({ guideId: 'method-headers', nodeId: 'm1', methodLabel: 'getCustomers' })
    })

    it('says so when the named method is not there', () => {
        startWorkflowGuide('method-body', 'updateTicket')
        expect(notifyError).toHaveBeenCalledWith('guides.errors.noMatch{"method":"updateTicket"}')
        expect(useWorkflowGuideStore.getState().active).toBeNull()
    })

    it('stays out of the way of the tutorial', () => {
        useWorkflowTutorialStore.setState({ requested: true })
        startWorkflowGuide('method-url')
        expect(useWorkflowGuideStore.getState().active).toBeNull()
    })

    it('runs from the palette with and without a method name', async () => {
        const headers = workflowGuideCommand.children?.find(child => child.value === 'headers')
        await headers?.execute?.({}, {} as never)
        expect(useWorkflowGuideStore.getState().active?.nodeId).toBe('m1')

        useWorkflowGuideStore.setState({ active: null })
        await headers?.children?.[0].execute?.({ method: 'getCustomers' }, {} as never)
        expect(useWorkflowGuideStore.getState().active?.guideId).toBe('method-headers')
    })
})
