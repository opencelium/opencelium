import { afterEach, describe, expect, it, vi } from 'vitest'
import { usePendingScriptStore } from './pendingScript.store'

describe('pending script', () => {
    afterEach(() => {
        usePendingScriptStore.setState({ pending: null })
        vi.useRealTimers()
    })

    it('goes to the requested transformation once', () => {
        usePendingScriptStore.getState().request({ enhanceId: 'e1', description: 'upper case', isApplied: true })
        expect(usePendingScriptStore.getState().take('e2')).toBeNull()
        expect(usePendingScriptStore.getState().take('e1')).toEqual({ enhanceId: 'e1', description: 'upper case', isApplied: true })
        expect(usePendingScriptStore.getState().take('e1')).toBeNull()
    })

    it('is not run by a visit long after the request', () => {
        vi.useFakeTimers()
        usePendingScriptStore.getState().request({ enhanceId: 'e1', description: 'upper case', isApplied: true })
        vi.advanceTimersByTime(31_000)
        expect(usePendingScriptStore.getState().take('e1')).toBeNull()
    })
})
