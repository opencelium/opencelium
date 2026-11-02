import type { ReactNode } from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@shared/i18n/hooks/useI18n', () => ({ useI18n: () => ({ t: (key: string) => key, lang: 'en' }) }))
// Provider-free stand-ins; the real primitives need SystemProvider.
vi.mock('@shared/ui/primitives/Button', () => ({
    Button: ({ children, onClick, testId }: { children?: ReactNode; onClick?: () => void; testId?: string }) =>
        <button data-testid={testId} onClick={onClick}>{children}</button>,
}))
vi.mock('@shared/ui/primitives/Icon', () => ({ Icon: ({ name }: { name: string }) => <i data-icon={name} /> }))
vi.mock('@shared/theme/hooks/useTheme', () => ({ useTheme: () => ({ themeMode: 'light' }) }))
// jsdom lays nothing out, so "visible" means "in the document" here.
vi.mock('../../workflow-tutorial/model/findVisibleTarget', () => ({
    findVisibleTarget: (selector: string) => document.querySelector(selector),
}))
const spotlight = vi.hoisted(() => ({ target: null as string | null }))
vi.mock('../../workflow-tutorial/ui/TutorialSpotlight', () => ({
    TutorialSpotlight: ({ target }: { target: string | null }) => {
        spotlight.target = target
        return null
    },
}))

import { workflowCommandBridgeStore } from '@features/workflow/command/workflowCommandBridge'
import { useWorkflowGuideStore } from '../model/workflowGuide.store'
import { WorkflowGuide } from './WorkflowGuide'

const NODE = '[data-testid="rf__node-n1"]'
const MENU_ITEM = '[data-testid="workflow-context-menu-edit-headers"]'
const HEADER_EDITOR = '[data-testid="workflow-request-header"]'

const mount = (testId: string) => {
    const element = document.createElement('div')
    element.setAttribute('data-testid', testId)
    document.body.appendChild(element)
    return element
}
const nextFrame = () => act(async () => { await new Promise(resolve => requestAnimationFrame(() => resolve(null))) })
const currentStep = () => document.querySelector('[data-state="current"]')?.textContent

describe('WorkflowGuide', () => {
    beforeEach(() => {
        workflowCommandBridgeStore.setState({ isActive: true })
        useWorkflowGuideStore.setState({ active: { guideId: 'method-headers', nodeId: 'n1', methodLabel: 'getCustomers' } })
        spotlight.target = null
    })
    afterEach(() => {
        useWorkflowGuideStore.setState({ active: null })
        workflowCommandBridgeStore.setState({ isActive: false })
        document.body.innerHTML = ''
    })

    it('walks from the node to the menu entry to the header editor', async () => {
        mount('rf__node-n1')
        render(<WorkflowGuide />)
        await nextFrame()
        expect(spotlight.target).toBe(NODE)
        expect(currentStep()).toContain('guides.method-headers.node')

        mount('workflow-context-menu-edit-headers')
        await nextFrame()
        expect(spotlight.target).toBe(MENU_ITEM)
        expect(currentStep()).toContain('guides.method-headers.menu')

        mount('workflow-request-header')
        await nextFrame()
        expect(spotlight.target).toBe(HEADER_EDITOR)
        expect(currentStep()).toContain('guides.method-headers.arrived')
        expect(screen.getByTestId('workflow-guide-close')).toHaveTextContent('guides.actions.done')
    })

    it('ends once the user closes what it led them to', async () => {
        mount('rf__node-n1')
        const editor = mount('workflow-request-header')
        render(<WorkflowGuide />)
        await nextFrame()
        editor.remove()
        await nextFrame()
        expect(useWorkflowGuideStore.getState().active).toBeNull()
    })

    it('ends when the editor is left', async () => {
        render(<WorkflowGuide />)
        act(() => workflowCommandBridgeStore.setState({ isActive: false }))
        expect(useWorkflowGuideStore.getState().active).toBeNull()
        expect(screen.queryByTestId('workflow-guide-card')).toBeNull()
    })

    it('can be stopped from the card', () => {
        render(<WorkflowGuide />)
        fireEvent.click(screen.getByTestId('workflow-guide-close'))
        expect(useWorkflowGuideStore.getState().active).toBeNull()
    })

    describe('the transformation guide', () => {
        const row = (key: string) => {
            const editor = document.querySelector('[data-testid="workflow-request-body"]') ?? mount('workflow-request-body')
            const element = document.createElement('div')
            element.className = 'variable-row'
            element.textContent = `"${key}" : value`
            editor.appendChild(element)
        }
        beforeEach(() => {
            useWorkflowGuideStore.setState({ active: { guideId: 'method-transformation', nodeId: 'n1', methodLabel: 'createClient', part: 'body', field: 'name' } })
        })

        it('walks into the body, onto the field, through the script to the playground', async () => {
            mount('rf__node-n1')
            mount('workflow-method-dialog-close')
            render(<WorkflowGuide />)
            row('name')
            await nextFrame()
            expect(currentStep()).toContain('guides.method-transformation.field')

            mount('workflow-enhancement-create')
            await nextFrame()
            expect(currentStep()).toContain('guides.method-transformation.create')

            const script = document.createElement('div')
            script.id = 'enhancement_code'
            document.body.appendChild(script)
            mount('script-playground-toggle')
            await nextFrame()
            // Writing a script shows nothing to detect: the card waits for Next.
            expect(currentStep()).toContain('guides.method-transformation.script')
            fireEvent.click(screen.getByTestId('workflow-guide-next'))
            await nextFrame()
            expect(currentStep()).toContain('guides.method-transformation.playground')

            const playground = document.createElement('section')
            playground.className = 'scriptPlayground'
            document.body.appendChild(playground)
            // The playground folds the body away; the guide stays until the dialog closes.
            document.querySelector('[data-testid="workflow-request-body"]')?.remove()
            await nextFrame()
            expect(currentStep()).toContain('guides.method-transformation.arrived')
            expect(screen.getByTestId('workflow-guide-close')).toHaveTextContent('guides.actions.done')
        })

        it('ends at the body when the method has no reference to transform', async () => {
            useWorkflowGuideStore.setState({ active: { guideId: 'method-transformation', nodeId: 'n1', methodLabel: 'getCustomers', part: 'body', field: null } })
            mount('rf__node-n1')
            mount('workflow-request-body')
            render(<WorkflowGuide />)
            await nextFrame()
            expect(currentStep()).toContain('guides.method-transformation.noReference')
        })
    })
})
