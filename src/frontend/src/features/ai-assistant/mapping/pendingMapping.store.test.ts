import { afterEach, describe, expect, it, vi } from 'vitest'
import { usePendingMappingStore } from './pendingMapping.store'

describe('pending mapping', () => {
    afterEach(() => {
        usePendingMappingStore.setState({ pending: null })
        vi.useRealTimers()
    })

    it('goes to the requested method\'s editor once', () => {
        usePendingMappingStore.getState().request({ methodId: 'b', source: { methodId: 'a', label: 'getCustomers' } })
        expect(usePendingMappingStore.getState().take('a')).toBeNull()
        expect(usePendingMappingStore.getState().take('b')).toEqual({ methodId: 'b', source: { methodId: 'a', label: 'getCustomers' } })
        expect(usePendingMappingStore.getState().take('b')).toBeNull()
    })

    it('is not run by a visit long after the request', () => {
        vi.useFakeTimers()
        usePendingMappingStore.getState().request({ methodId: 'b', source: null })
        vi.advanceTimersByTime(31_000)
        expect(usePendingMappingStore.getState().take('b')).toBeNull()
    })
})
