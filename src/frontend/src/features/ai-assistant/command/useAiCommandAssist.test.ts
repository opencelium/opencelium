import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

const guide = vi.hoisted(() => ({ result: 'handled' as string, asked: [] as { prompt: string; hasConfirm: boolean }[] }))
vi.mock('../editor/askWorkflowEditor', () => ({
    askWorkflowEditor: async (prompt: string, confirmEdit?: unknown) => {
        guide.asked.push({ prompt, hasConfirm: Boolean(confirmEdit) })
        return guide.result
    },
}))
vi.mock('@shared/ui/confirm/ConfirmDialogContext', () => ({ useConfirm: () => async () => true }))
vi.mock('@shared/i18n/hooks/useI18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))
const routeCommand = vi.hoisted(() => vi.fn())
vi.mock('../api/aiApi', () => ({
    isAiConfigured: () => true,
    useGetAiHealthQuery: () => ({ isError: false, data: { status: 'ok' } }),
    useRouteCommandMutation: () => [routeCommand],
}))
vi.mock('react-router-dom', () => ({ useLocation: () => ({ pathname: '/workflow/update/1' }) }))
vi.mock('@shared/command/useCommandPolicyContext', () => ({ useCommandPolicyContext: () => ({}) }))
vi.mock('@shared/command/tree', () => ({ getDynamicCommandTree: () => [] }))
vi.mock('./useCommandSuggestions', () => ({ useCommandSuggestions: () => [] }))
const proposal = vi.hoisted(() => ({ current: null as unknown }))
vi.mock('./commandProposal', () => ({ toCatalogItem: (entry: unknown) => entry, toCommandProposal: async () => proposal.current }))

import { workflowCommandBridgeStore } from '@features/workflow/command/workflowCommandBridge'
import { useAiCommandAssist } from './useAiCommandAssist'

const render = () => {
    const onGuide = vi.fn()
    const onRun = vi.fn()
    const { result } = renderHook(() => useAiCommandAssist({ query: '', isUnmatched: true, onRun, onRunIntent: vi.fn(), onGuide }))
    return { result, onGuide, onRun }
}

const ready = (phrase: string, effect: 'open' | 'run' | 'destructive') =>
    ({ kind: 'ready', entry: { effect }, reply: '', phrase, label: phrase, isAutoRun: effect === 'open' })

describe('useAiCommandAssist in the workflow editor', () => {
    afterEach(() => {
        workflowCommandBridgeStore.setState({ isActive: false })
        guide.asked = []
        routeCommand.mockReset()
    })

    it('starts a guide straight from a spoken request, without asking the command router', async () => {
        workflowCommandBridgeStore.setState({ isActive: true })
        guide.result = 'handled'
        const { result, onGuide } = render()
        await act(() => result.current.ask('where is the header of the get all user method?'))
        expect(guide.asked.map(item => item.prompt)).toEqual(['where is the header of the get all user method?'])
        expect(onGuide).toHaveBeenCalled()
        expect(routeCommand).not.toHaveBeenCalled()
        expect(result.current.state.status).toBe('idle')
    })

    it('leaves a request no guide answers to the command router', async () => {
        workflowCommandBridgeStore.setState({ isActive: true })
        guide.result = 'unhandled'
        routeCommand.mockReturnValue({ unwrap: () => Promise.reject(new Error('stop here')) })
        const { result, onGuide } = render()
        await act(() => result.current.ask('list the users'))
        expect(onGuide).not.toHaveBeenCalled()
        expect(routeCommand).toHaveBeenCalled()
    })

    it('lets the editor change the workflow without asking only when the assistant was addressed by name', async () => {
        workflowCommandBridgeStore.setState({ isActive: true })
        guide.result = 'handled'
        const { result } = render()
        await act(() => result.current.ask('add get all users from CRM'))
        await act(() => result.current.ask('add get all users from CRM', { isAddressed: true }))
        expect(guide.asked.map(item => item.hasConfirm)).toEqual([true, false])
    })

    it('does not ask for a guide outside the editor', async () => {
        routeCommand.mockReturnValue({ unwrap: () => Promise.reject(new Error('stop here')) })
        const { result } = render()
        await act(() => result.current.ask('where is the header'))
        expect(guide.asked).toEqual([])
    })
})

describe('useAiCommandAssist for requests said to Beebot', () => {
    afterEach(() => routeCommand.mockReset())

    const answer = { unwrap: async () => ({ commandId: 'x', isQuestion: false }) }

    it('runs the command at once', async () => {
        routeCommand.mockReturnValue(answer)
        proposal.current = ready('ui theme light', 'run')
        const { result, onRun } = render()
        let outcome
        await act(async () => { outcome = await result.current.ask('switch to light mode', { isAddressed: true }) })
        expect(onRun).toHaveBeenCalledWith('ui theme light', true)
        expect(outcome).toEqual({ kind: 'done' })
    })

    it('still waits for the click when the same request is typed or spoken into the palette', async () => {
        routeCommand.mockReturnValue(answer)
        proposal.current = ready('ui theme light', 'run')
        const { result, onRun } = render()
        let outcome
        await act(async () => { outcome = await result.current.ask('switch to light mode') })
        expect(onRun).not.toHaveBeenCalled()
        expect(outcome).toEqual({ kind: 'answer' })
    })

    it('never deletes without the click', async () => {
        routeCommand.mockReturnValue(answer)
        proposal.current = ready('delete user ba@user.com', 'destructive')
        const { result, onRun } = render()
        let outcome
        await act(async () => { outcome = await result.current.ask('delete the user ba@user.com', { isAddressed: true }) })
        expect(onRun).not.toHaveBeenCalled()
        // The palette shows it for the click.
        expect(outcome).toEqual({ kind: 'answer' })
    })

    it('reports a failure instead of leaving it in the palette', async () => {
        routeCommand.mockReturnValue({ unwrap: () => Promise.reject(new Error('down')) })
        const { result } = render()
        let outcome
        await act(async () => { outcome = await result.current.ask('switch to light mode', { isAddressed: true }) })
        expect(outcome).toMatchObject({ kind: 'error' })
    })
})
