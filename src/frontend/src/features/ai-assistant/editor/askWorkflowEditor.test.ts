import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const gateway = vi.hoisted(() => ({
    requests: [] as { endpoint: string; body: Record<string, unknown> }[],
    answers: {} as Record<string, unknown>,
    isDown: false,
    failing: '',
}))
vi.mock('../api/aiApi', () => ({
    aiApi: {
        endpoints: {
            routeGuide: { initiate: (body: Record<string, unknown>) => ({ endpoint: 'routeGuide', body }) },
            readAddMethod: { initiate: (body: Record<string, unknown>) => ({ endpoint: 'readAddMethod', body }) },
            readMapping: { initiate: (body: Record<string, unknown>) => ({ endpoint: 'readMapping', body }) },
            readTransformation: { initiate: (body: Record<string, unknown>) => ({ endpoint: 'readTransformation', body }) },
        },
    },
}))
vi.mock('@app/store/store', () => ({
    store: {
        dispatch: (request: { endpoint: string; body: Record<string, unknown> }) => {
            gateway.requests.push(request)
            return { unwrap: async () => { if (gateway.isDown || gateway.failing === request.endpoint) throw new Error('down'); return gateway.answers[request.endpoint] } }
        },
    },
}))
const toast = vi.hoisted(() => ({ success: vi.fn(), info: vi.fn(), error: vi.fn() }))
vi.mock('antd', async (original) => ({ ...(await original<typeof import('antd')>()), message: { success: toast.success, info: toast.info } }))
vi.mock('@shared/ui/feedback/notifyError', () => ({ notifyError: toast.error }))
vi.mock('@shared/i18n/config/i18n', () => ({
    i18n: { language: 'en', getFixedT: (language: string) => (key: string, values?: Record<string, string>) =>
        key.endsWith('workflowAddMethod') ? `${language} add` : key.endsWith('workflowSuggestMapping') ? `${language} map` : key.endsWith('workflowApplyTransformation') ? `${language} transform` : `${key}${values ? JSON.stringify(values) : ''}` },
}))
vi.mock('@entities/connector/model/iconUrl', () => ({ resolveConnectorIcon: () => null }))

import type { Connector } from '@entities/connector/model/types'
import type { WorkflowEdgeModel, WorkflowNodeModel } from '@features/workflow/types/workflow.types'
import { workflowCommandBridgeStore } from '@features/workflow/command/workflowCommandBridge'
import { useWorkflowGuideStore } from '@features/onboarding/guides/model/workflowGuide.store'
import { usePendingMappingStore } from '../mapping/pendingMapping.store'
import { usePendingScriptStore } from '../hooks/pendingScript.store'
import { requestEditorBridgeStore, type OpenRequestEditor } from '@features/workflow/command/requestEditorBridge'
import { workflowAssistBridgeStore } from '@features/workflow/command/workflowAssistBridge'
import { askWorkflowEditor } from './askWorkflowEditor'

const method = (id: string, label: string) => ({
    id, type: 'connector', position: { x: 0, y: 0 }, data: { title: 'CRM', subtitle: label, kind: 'connector', methodConfig: { name: label } },
}) as unknown as WorkflowNodeModel
const crm = { connectorId: 7, title: 'CRM', invoker: { name: 'CRM', operations: [{ name: 'getAllUsers', type: 'GET' }] } } as unknown as Connector
const addStep = vi.fn(() => 'new-1')
const openRequestEditor = vi.fn()

describe('askWorkflowEditor', () => {
    beforeEach(() => {
        gateway.requests = []
        gateway.isDown = false
        gateway.failing = ''
        workflowCommandBridgeStore.setState({
            isActive: true, isEditable: () => true, getConnectors: () => [crm],
            getNodes: () => [method('a', 'getCustomers'), method('b', 'createClient')],
            getEdges: () => [{ id: 'a-b', source: 'a', target: 'b', type: 'workflow-edge' }] as WorkflowEdgeModel[],
            addStep, openRequestEditor, centerOnNode: vi.fn(),
        })
    })
    afterEach(() => {
        workflowCommandBridgeStore.setState({ isActive: false })
        useWorkflowGuideStore.setState({ active: null })
        usePendingMappingStore.setState({ pending: null })
        vi.clearAllMocks()
    })

    it('offers the guides and adding a method, in both languages', async () => {
        gateway.answers.routeGuide = { guideId: null, method: '' }
        expect(await askWorkflowEditor('order a pizza')).toBe('unhandled')
        const options = (gateway.requests[0]?.body.guides as { id: string; description: string }[])
        expect(options.map(option => option.id)).toEqual(['method-url', 'method-headers', 'method-body', 'method-try',
            'method-transformation', 'add-method', 'suggest-mapping', 'apply-transformation',
            'test-workflow', 'stop-test', 'explain-failure', 'fix-failure', 'apply-fix', 'explain-workflow', 'show-logs', 'show-problems'])
        expect(options.find(option => option.id === 'test-workflow')).toMatchObject({ isAction: true, withMethod: 'method-try' })
        expect(options.find(option => option.id === 'explain-failure')).toMatchObject({ isAction: false })
        expect(options[4]).toMatchObject({ id: 'method-transformation', teaches: 'apply-transformation' })
        expect(options[5]).toEqual({ id: 'add-method', description: 'en add · de add', isAction: true })
        expect(options[6]).toEqual({ id: 'suggest-mapping', description: 'en map · de map', isAction: true })
    })

    it('starts the guide the gateway names', async () => {
        gateway.answers.routeGuide = { guideId: 'method-headers', method: 'createClient' }
        expect(await askWorkflowEditor('headers of create client')).toBe('handled')
        expect(useWorkflowGuideStore.getState().active).toMatchObject({ guideId: 'method-headers', nodeId: 'b' })
    })

    it('takes the transformation guide into the headers when the request says so', async () => {
        const headers = { ...method('b', 'createClient'), data: { ...method('b', 'createClient').data,
            methodConfig: { name: 'createClient', headers: { Authorization: '#AABBCC.(response).body.$.token' } } } } as unknown as WorkflowNodeModel
        workflowCommandBridgeStore.setState({ getNodes: () => [method('a', 'getCustomers'), headers] })
        gateway.answers.routeGuide = { guideId: 'method-transformation', method: '' }
        expect(await askWorkflowEditor('how do I transform a value in the headers?')).toBe('handled')
        expect(useWorkflowGuideStore.getState().active).toMatchObject({ guideId: 'method-transformation', nodeId: 'b', part: 'header', field: 'Authorization' })
    })

    it('adds the method the request describes, with the workflow\'s steps in order', async () => {
        gateway.answers.routeGuide = { guideId: 'add-method', method: '' }
        gateway.answers.readAddMethod = { connectorId: '7', operation: 'getAllUsers', spokenMethod: 'get all users', position: 'before', stepId: 'b' }
        expect(await askWorkflowEditor('add get all users from CRM before createClient')).toBe('handled')
        expect(gateway.requests[1]?.body).toMatchObject({
            connectors: [{ id: '7', title: 'CRM', invoker: 'CRM' }],
            steps: [{ id: 'a', label: 'getCustomers' }, { id: 'b', label: 'createClient' }],
        })
        expect(addStep).toHaveBeenCalledWith(expect.objectContaining({ methodName: 'getAllUsers', connector: expect.objectContaining({ connectorId: 7 }) }))
        expect(toast.success).toHaveBeenCalledWith('commandPalette.workflowEdit.added{"method":"getAllUsers","connector":"CRM"}')
    })

    it('asks first when given a confirmation, and adds nothing when declined', async () => {
        gateway.answers.routeGuide = { guideId: 'add-method', method: '' }
        gateway.answers.readAddMethod = { connectorId: '7', operation: 'getAllUsers', spokenMethod: 'get all users', position: 'after', stepId: null }
        const confirmEdit = vi.fn(async () => false)
        expect(await askWorkflowEditor('add get all users from CRM', confirmEdit)).toBe('handled')
        expect(confirmEdit).toHaveBeenCalledWith({ method: 'getAllUsers', connector: 'CRM' })
        expect(addStep).not.toHaveBeenCalled()
    })

    it('says which method the connector does not have', async () => {
        gateway.answers.routeGuide = { guideId: 'add-method', method: '' }
        gateway.answers.readAddMethod = { connectorId: '7', operation: null, spokenMethod: 'send fax', position: 'after', stepId: null }
        await askWorkflowEditor('add send fax from CRM')
        expect(toast.error).toHaveBeenCalledWith('commandPalette.workflowEdit.unknownMethod{"method":"send fax","connector":"CRM"}')
        expect(addStep).not.toHaveBeenCalled()
    })

    it('does not change a workflow that cannot be edited', async () => {
        workflowCommandBridgeStore.setState({ isEditable: () => false })
        gateway.answers.routeGuide = { guideId: 'add-method', method: '' }
        await askWorkflowEditor('add get all users from CRM')
        expect(toast.error).toHaveBeenCalledWith('commandPalette.workflowEdit.notEditable')
        expect(gateway.requests).toHaveLength(1)
    })

    it('leaves the request to the palette when the gateway does not answer', async () => {
        gateway.isDown = true
        expect(await askWorkflowEditor('where is the body')).toBe('unhandled')
    })

    describe('suggesting references', () => {
        beforeEach(() => { gateway.answers.routeGuide = { guideId: 'suggest-mapping', method: '' } })

        it('opens the target\'s body with only the source\'s values asked for', async () => {
            gateway.answers.readMapping = { target: 'createClient', source: 'getCustomers' }
            expect(await askWorkflowEditor('suggest references for create client from get customers')).toBe('handled')
            expect(gateway.requests[1]?.body).toEqual({ prompt: 'suggest references for create client from get customers', methods: ['getCustomers', 'createClient'] })
            expect(usePendingMappingStore.getState().pending).toMatchObject({ methodId: 'b', source: { methodId: 'a', label: 'getCustomers' } })
            expect(openRequestEditor).toHaveBeenCalledWith({ nodeId: 'b', mode: 'body' })
        })

        it('falls back to the selected method when no target is named, offering every earlier value without a source', async () => {
            const selected = { ...method('b', 'createClient'), selected: true }
            workflowCommandBridgeStore.setState({ getNodes: () => [method('a', 'getCustomers'), selected] })
            gateway.answers.readMapping = { target: '', source: '' }
            await askWorkflowEditor('suggest a mapping')
            expect(usePendingMappingStore.getState().pending).toMatchObject({ methodId: 'b', source: null })
        })

        it('refuses one method as both target and source', async () => {
            gateway.answers.readMapping = { target: 'createClient', source: 'createClient' }
            await askWorkflowEditor('map create client from create client')
            expect(toast.error).toHaveBeenCalledWith('commandPalette.workflowEdit.sameMethod')
            expect(openRequestEditor).not.toHaveBeenCalled()
        })

        it('says so when the gateway cannot read the request', async () => {
            gateway.failing = 'readMapping'
            expect(await askWorkflowEditor('suggest a mapping for create client')).toBe('handled')
            expect(toast.error).toHaveBeenCalledWith('commandPalette.workflowEdit.mappingFailed')
            expect(openRequestEditor).not.toHaveBeenCalled()
        })
    })

    describe('applying a transformation', () => {
        let selectedField: string | null = null
        const openTransformation = vi.fn<OpenRequestEditor['openTransformation']>(() => ({ kind: 'opened', enhanceId: 'e1' }))
        const openBody = () => requestEditorBridgeStore.setState({ editor: {
            methodLabel: 'ConfigItemUpdate', messageProperty: 'body',
            fieldPaths: () => ['ConfigItem.Number', 'ConfigItem.CIXMLData.Vendor'], openTransformation,
            selectedFieldPath: () => selectedField,
        } })
        beforeEach(() => { gateway.answers.routeGuide = { guideId: 'apply-transformation', method: '' } })
        afterEach(() => {
            requestEditorBridgeStore.setState({ editor: null })
            usePendingScriptStore.setState({ pending: null })
        })

        it('works only on the body or headers open in the method dialog', async () => {
            expect(await askWorkflowEditor('apply transformation for vendor with upper case')).toBe('handled')
            expect(toast.error).toHaveBeenCalledWith('commandPalette.workflowEdit.noOpenEditor')
            expect(gateway.requests).toHaveLength(1)
        })

        it('opens the field\'s transformation and has its script written, applied at once when Beebot was asked', async () => {
            openBody()
            gateway.answers.readTransformation = { field: 'ConfigItem.CIXMLData.Vendor', spokenField: 'vendor', description: 'convert to upper case' }
            await askWorkflowEditor('apply transformation for vendor with convert to upper case')
            expect(gateway.requests[1]?.body).toEqual({ prompt: 'apply transformation for vendor with convert to upper case',
                fields: ['ConfigItem.Number', 'ConfigItem.CIXMLData.Vendor'] })
            expect(openTransformation).toHaveBeenCalledWith('ConfigItem.CIXMLData.Vendor')
            expect(usePendingScriptStore.getState().pending).toMatchObject({ enhanceId: 'e1', description: 'convert to upper case', isApplied: true })
        })

        it('offers the script for review when typed into the palette', async () => {
            openBody()
            gateway.answers.readTransformation = { field: 'ConfigItem.Number', spokenField: 'number', description: 'first 10 characters' }
            await askWorkflowEditor('apply transformation for number with first 10 characters', vi.fn(async () => true))
            expect(usePendingScriptStore.getState().pending).toMatchObject({ isApplied: false })
        })

        it('says when the field holds no reference to transform', async () => {
            openBody()
            openTransformation.mockReturnValueOnce({ kind: 'no-reference' })
            gateway.answers.readTransformation = { field: 'ConfigItem.Number', spokenField: 'number', description: 'trim' }
            await askWorkflowEditor('apply transformation for number with trim')
            expect(toast.error).toHaveBeenCalledWith('commandPalette.workflowEdit.noReference{"field":"ConfigItem.Number"}')
            expect(usePendingScriptStore.getState().pending).toBeNull()
        })

        it('says which named field the open editor does not have', async () => {
            openBody()
            gateway.answers.readTransformation = { field: '', spokenField: 'price', description: 'round it' }
            await askWorkflowEditor('apply transformation for price with round it')
            expect(toast.error).toHaveBeenCalledWith('commandPalette.workflowEdit.unknownField{"part":"commandPalette.workflowEdit.part.body","field":"price"}')
            expect(openTransformation).not.toHaveBeenCalled()
        })

        it('takes the selected field when the request names none', async () => {
            openBody()
            selectedField = 'ConfigItem.Number'
            gateway.answers.readTransformation = { field: '', spokenField: '', description: 'upper case' }
            await askWorkflowEditor('apply transformation for this property with upper case')
            expect(openTransformation).toHaveBeenCalledWith('ConfigItem.Number')
            selectedField = null
        })

        it('asks for the field when none is named or selected', async () => {
            openBody()
            gateway.answers.readTransformation = { field: '', spokenField: '', description: 'upper case' }
            await askWorkflowEditor('apply transformation with upper case')
            expect(toast.error).toHaveBeenCalledWith('commandPalette.workflowEdit.noFieldNamed{"part":"commandPalette.workflowEdit.part.body"}')
        })
    })

    describe('running and debugging', () => {
        const route = (guideId: string) => { gateway.answers.routeGuide = { guideId, method: '' } }
        afterEach(() => workflowAssistBridgeStore.setState({ handlers: {} }))

        it('starts the test run, and says when one is already going or cannot start', async () => {
            const startTest = vi.fn<() => 'started' | 'running' | 'unavailable'>(() => 'started')
            workflowAssistBridgeStore.getState().register('startTest', startTest)
            route('test-workflow')
            expect(await askWorkflowEditor('test the workflow')).toBe('handled')
            expect(startTest).toHaveBeenCalledOnce()
            expect(toast.info).not.toHaveBeenCalled()
            startTest.mockReturnValueOnce('running')
            await askWorkflowEditor('run the workflow')
            expect(toast.info).toHaveBeenCalledWith('commandPalette.workflowAssist.testRunning')
            startTest.mockReturnValueOnce('unavailable')
            await askWorkflowEditor('run the workflow')
            expect(toast.error).toHaveBeenCalledWith('commandPalette.workflowAssist.testUnavailable')
        })

        it('opens the logs and explains the failure', async () => {
            const showLogs = vi.fn()
            const explainFailure = vi.fn()
            workflowAssistBridgeStore.getState().register('showLogs', showLogs)
            workflowAssistBridgeStore.getState().register('explainFailure', explainFailure)
            route('explain-failure')
            expect(await askWorkflowEditor('why did it fail?')).toBe('handled')
            expect(showLogs).toHaveBeenCalledOnce()
            expect(explainFailure).toHaveBeenCalledOnce()
        })

        it('says there is no failed run to explain or fix', async () => {
            route('fix-failure')
            expect(await askWorkflowEditor('fix it')).toBe('handled')
            expect(toast.info).toHaveBeenCalledWith('commandPalette.workflowAssist.noFailure')
        })

        it('says when the failure has no request to fix', async () => {
            workflowAssistBridgeStore.getState().register('fixFailure', () => false)
            route('fix-failure')
            await askWorkflowEditor('fix it')
            expect(toast.info).toHaveBeenCalledWith('commandPalette.workflowAssist.notFixable')
        })

        it('applies the proposed fix, or says there is none', async () => {
            const applyFix = vi.fn(() => true)
            workflowAssistBridgeStore.getState().register('applyFix', applyFix)
            route('apply-fix')
            await askWorkflowEditor('apply the fix')
            expect(applyFix).toHaveBeenCalledOnce()
            expect(toast.info).not.toHaveBeenCalled()
            applyFix.mockReturnValueOnce(false)
            await askWorkflowEditor('apply the fix')
            expect(toast.info).toHaveBeenCalledWith('commandPalette.workflowAssist.noFix')
        })

        it('explains the workflow only when it has steps to explain', async () => {
            route('explain-workflow')
            await askWorkflowEditor('what does this workflow do?')
            expect(toast.info).toHaveBeenCalledWith('commandPalette.workflowAssist.noSteps')
            const explainWorkflow = vi.fn()
            const unregister = workflowAssistBridgeStore.getState().register('explainWorkflow', explainWorkflow)
            await askWorkflowEditor('what does this workflow do?')
            expect(explainWorkflow).toHaveBeenCalledOnce()
            unregister()
            expect(workflowAssistBridgeStore.getState().handlers.explainWorkflow).toBeUndefined()
        })
    })
})
