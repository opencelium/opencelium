import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

const toast = vi.hoisted(() => ({ destroy: vi.fn(), error: vi.fn() }))
vi.mock('antd', () => ({ message: { destroy: toast.destroy } }))
vi.mock('@shared/ui/feedback/notifyError', () => ({ notifyError: toast.error }))
vi.mock('@shared/i18n/hooks/useI18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))

import type { AiCommandAssist, AskOutcome } from '../command/useAiCommandAssist'
import { useSpokenRequestStore } from './spokenRequest.store'
import { useAddressedRequests } from './useAddressedRequests'

function hear(outcome: AskOutcome, isAvailable = true) {
    const ask = vi.fn(async () => outcome)
    const onAnswer = vi.fn()
    renderHook(() => useAddressedRequests({ assist: { ask, isAvailable } as unknown as AiCommandAssist, onAnswer }))
    return { ask, onAnswer, say: (text: string) => act(async () => { useSpokenRequestStore.getState().send(text) }) }
}

describe('useAddressedRequests', () => {
    afterEach(() => vi.clearAllMocks())

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
})
