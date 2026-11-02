import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

const gateway = vi.hoisted(() => ({ requests: [] as Record<string, unknown>[] }))
vi.mock('react-redux', () => ({ useDispatch: () => vi.fn() }))
vi.mock('@shared/i18n/hooks/useI18n', () => ({ useI18n: () => ({ lang: 'en', t: (key: string) => key }) }))
vi.mock('../api/aiApi', () => ({
    aiApi: { endpoints: { suggestMapping: { initiate: (body: Record<string, unknown>) => body } } },
}))
vi.mock('@app/store/store', () => ({
    store: {
        dispatch: (body: Record<string, unknown>) => {
            gateway.requests.push(body)
            return { unwrap: async () => ({ suggestions: [{ field: 'name', source: 's2', reason: 'same meaning' }], durationMs: 1, model: 'm' }) }
        },
    },
}))
vi.mock('@features/workflow/utils/referenceMethodVisibility', () => ({
    getEligibleReferenceMethods: () => [{ id: 'a' }, { id: 'c' }],
}))
vi.mock('./mappingCandidates', () => ({
    collectMappingSources: () => [
        { id: 's1', methodId: 'c', step: 'ConfigItemSearch', system: '', path: 'id', reference: '#C.(response).body.$.id' },
        { id: 's2', methodId: 'a', step: 'getCustomers', system: '', path: 'name', reference: '#A.(response).body.$.name' },
    ],
    collectMappingTargets: () => [{ path: 'name', namespace: [], name: 'name', current: '' }],
    setTargetValue: vi.fn(),
}))

import type { Connection, MethodWithId } from '@features/workflow/types/connection'
import { usePendingMappingStore } from './pendingMapping.store'
import { useAiFieldMapping } from './useAiFieldMapping'

const connection = { fromConnector: { method: [], operator: [] } } as unknown as Connection
const method = { id: 'b', name: 'createClient', label: '', color: '#B' } as unknown as MethodWithId

describe('useAiFieldMapping, asked from outside the editor', () => {
    afterEach(() => {
        gateway.requests = []
        usePendingMappingStore.setState({ pending: null })
    })

    it('runs a pending request for its method with only the named source\'s values', async () => {
        usePendingMappingStore.getState().request({ methodId: 'b', source: { methodId: 'a', label: 'getCustomers' } })
        const { result } = renderHook(() => useAiFieldMapping({ connection, method, body: { name: '' } }))
        await waitFor(() => expect(result.current.state.status).toBe('suggested'))
        expect(gateway.requests[0]?.sources).toEqual([{ id: 's2', step: 'getCustomers', system: '', path: 'name' }])
        expect(result.current.state).toMatchObject({ onlyFrom: 'getCustomers', proposals: [{ source: { id: 's2' } }] })
        expect(usePendingMappingStore.getState().pending).toBeNull()
    })

    it('leaves another method\'s request waiting', async () => {
        usePendingMappingStore.getState().request({ methodId: 'x', source: null })
        const { result } = renderHook(() => useAiFieldMapping({ connection, method, body: { name: '' } }))
        await act(async () => {})
        expect(result.current.state.status).toBe('idle')
        expect(usePendingMappingStore.getState().pending?.methodId).toBe('x')
    })

    it('says so when the source does not come before the method', async () => {
        usePendingMappingStore.getState().request({ methodId: 'b', source: { methodId: 'z', label: 'TicketCreate' } })
        const { result } = renderHook(() => useAiFieldMapping({ connection, method, body: { name: '' } }))
        await waitFor(() => expect(result.current.state).toEqual({ status: 'sourceNotEarlier', source: 'TicketCreate' }))
        expect(gateway.requests).toHaveLength(0)
    })
})
