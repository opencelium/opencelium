import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

const toast = vi.hoisted(() => ({ destroy: vi.fn(), error: vi.fn(), info: vi.fn() }))
const voice = vi.hoisted(() => ({ speak: vi.fn() }))
vi.mock('antd', () => ({ message: { destroy: toast.destroy, info: toast.info } }))
vi.mock('./speechOutput', () => ({ canSpeak: () => true, speak: voice.speak, stopSpeaking: vi.fn(), isSpeaking: () => false }))
vi.mock('@shared/i18n/config/i18n', () => ({ i18n: { language: 'en', getFixedT: () => (key: string) => key } }))
vi.mock('@shared/ui/feedback/notifyError', () => ({ notifyError: toast.error }))
vi.mock('@shared/i18n/hooks/useI18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))

import type { AiCommandAssist, AskOutcome } from '../command/useAiCommandAssist'
import { useSpokenRequestStore } from './spokenRequest.store'
import { useAddressedRequests } from './useAddressedRequests'
import { useBeebotReplyStore } from './beebotReply.store'
import { useOpenConfirmStore } from '@shared/ui/confirm/openConfirm.store'

function hear(outcome: AskOutcome, isAvailable = true) {
    const ask = vi.fn(async () => outcome)
    const reset = vi.fn()
    const onAnswer = vi.fn()
    renderHook(() => useAddressedRequests({ assist: { ask, reset, isAvailable } as unknown as AiCommandAssist, onAnswer }))
    return { ask, reset, onAnswer, say: (text: string) => act(async () => { useSpokenRequestStore.getState().send(text) }) }
}

describe('useAddressedRequests', () => {
    afterEach(() => {
        vi.clearAllMocks()
        useBeebotReplyStore.setState({ isMuted: false, isAnswering: false })
    })

    it('acts without opening the palette and closes the thinking toast', async () => {
        const { ask, onAnswer, say } = hear({ kind: 'done' })
        await say('switch to light mode')
        expect(ask).toHaveBeenCalledWith('switch to light mode', { isAddressed: true })
        expect(onAnswer).not.toHaveBeenCalled()
        expect(toast.destroy).toHaveBeenCalledWith('spoken-request')
    })

    it('opens the palette only for an answer the user has to look at', async () => {
        const { onAnswer, say } = hear({ kind: 'answer' })
        await say('delete the user ba@user.com')
        expect(onAnswer).toHaveBeenCalledWith('delete the user ba@user.com')
    })

    it('tells a failure as a notification', async () => {
        const { onAnswer, say } = hear({ kind: 'error', error: 'unreachable' })
        await say('switch to light mode')
        expect(toast.error).toHaveBeenCalledWith('commandPalette.ai.unreachable')
        expect(onAnswer).not.toHaveBeenCalled()
    })

    it('says so when the AI is not there to ask', async () => {
        const { say } = hear({ kind: 'skipped' }, false)
        await say('switch to light mode')
        expect(toast.error).toHaveBeenCalledWith('commandPalette.ai.unreachable')
    })

    describe('answering aloud', () => {
        it('says "done" when the request reported nothing itself', async () => {
            const { say } = hear({ kind: 'done' })
            await say('switch to light mode')
            expect(voice.speak).toHaveBeenCalledWith('commandPalette.beebot.done', expect.any(Function))
        })

        it('says what the request reported instead, once', async () => {
            const ask = vi.fn(async () => {
                useBeebotReplyStore.getState().reply('Added CreateTicket from Zammad.')
                return { kind: 'done' } as AskOutcome
            })
            renderHook(() => useAddressedRequests({ assist: { ask, reset: vi.fn(), isAvailable: true } as unknown as AiCommandAssist, onAnswer: vi.fn() }))
            await act(async () => { useSpokenRequestStore.getState().send('add create ticket') })
            expect(voice.speak).toHaveBeenCalledTimes(1)
            expect(voice.speak).toHaveBeenCalledWith('Added CreateTicket from Zammad.', expect.any(Function))
        })

        it('says the failure it shows', async () => {
            const { say } = hear({ kind: 'error', error: 'failed' })
            await say('switch to light mode')
            expect(voice.speak).toHaveBeenCalledWith('commandPalette.ai.failed', expect.any(Function))
        })

        it('stays silent when muted', async () => {
            useBeebotReplyStore.getState().setMuted(true)
            const { say } = hear({ kind: 'done' })
            await say('switch to light mode')
            expect(voice.speak).not.toHaveBeenCalled()
        })

        it('reads out a question it asks while answering', async () => {
            const ask = vi.fn(async () => {
                useOpenConfirmStore.getState().set({ text: 'Remove this step? Remove CreateTicket from the workflow?', isDanger: true,
                    openedAt: Date.now(), answer: vi.fn() })
                return { kind: 'done' } as AskOutcome
            })
            renderHook(() => useAddressedRequests({ assist: { ask, reset: vi.fn(), isAvailable: true } as unknown as AiCommandAssist, onAnswer: vi.fn() }))
            await act(async () => { useSpokenRequestStore.getState().send('remove create ticket') })
            expect(voice.speak).toHaveBeenCalledWith('Remove this step? Remove CreateTicket from the workflow?', expect.any(Function))
            useOpenConfirmStore.getState().set(null)
        })
    })

    it('answers "what can you do?" from its own list, without the AI', async () => {
        const { ask, say } = hear({ kind: 'done' })
        await say('what can you do?')
        expect(ask).not.toHaveBeenCalled()
        expect(toast.info).toHaveBeenCalled()
        expect(voice.speak).toHaveBeenCalledWith('commandPalette.beebot.capabilities.intro', expect.any(Function))
    })

    it('drops the request in progress on "stop"', async () => {
        const { reset } = hear({ kind: 'done' })
        await act(async () => { useSpokenRequestStore.getState().cancel() })
        expect(reset).toHaveBeenCalledOnce()
    })

    it('runs "A and then B" one after the other, and stops at the first that does not go through', async () => {
        const ask = vi.fn<(text: string) => Promise<AskOutcome>>(async () => ({ kind: 'done' }))
        const onAnswer = vi.fn()
        renderHook(() => useAddressedRequests({ assist: { ask, reset: vi.fn(), isAvailable: true } as unknown as AiCommandAssist, onAnswer }))
        await act(async () => { useSpokenRequestStore.getState().send('add a loop after SearchIssues and then add an if after it') })
        expect(ask.mock.calls.map(call => call[0])).toEqual(['add a loop after SearchIssues', 'add an if after it'])
        ask.mockClear()
        ask.mockResolvedValueOnce({ kind: 'answer' })
        await act(async () => { useSpokenRequestStore.getState().send('delete the user ba@user.com and then switch to dark mode') })
        expect(ask).toHaveBeenCalledTimes(1)
        expect(onAnswer).toHaveBeenCalledWith('delete the user ba@user.com')
    })
})
