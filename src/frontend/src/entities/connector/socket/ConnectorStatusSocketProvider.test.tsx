import {beforeEach, describe, expect, it, vi} from 'vitest'
import {act, render} from '@testing-library/react'
import type {ConnectorMetaDTO} from '@entities/connector/model/types'

let mockStatus: 'idle' | 'connected' | 'disconnected' = 'connected'
vi.mock('@shared/api/socket/useSocket', () => ({
    useSocket: () => ({client: {}, status: mockStatus, error: null}),
}))

let lastDestination = ''
let lastHandler: ((data: ConnectorMetaDTO) => void) | null = null
vi.mock('@shared/api/socket/useStompSubscription', () => ({
    useStompSubscription: (
        _client: unknown,
        _isConnected: boolean,
        destination: string,
        onMessage: (data: ConnectorMetaDTO) => void,
    ) => {
        lastDestination = destination
        lastHandler = onMessage
    },
}))

const dispatchMock = vi.fn()
vi.mock('@app/store/store', () => ({
    store: {dispatch: (...args: unknown[]) => dispatchMock(...args)},
}))

const updateQueryDataMock = vi.fn(
    (endpoint: string, arg: unknown, recipe: unknown) => ({type: 'updateQueryData', endpoint, arg, recipe}),
)
const invalidateTagsMock = vi.fn((tags: unknown) => ({type: 'invalidateTags', tags}))
vi.mock('@entities/connector/api/connectorApi', () => ({
    connectorApi: {
        util: {
            updateQueryData: (endpoint: string, arg: unknown, recipe: unknown) => updateQueryDataMock(endpoint, arg, recipe),
            invalidateTags: (tags: unknown) => invalidateTagsMock(tags),
        },
    },
}))

import {ConnectorStatusSocketProvider} from './ConnectorStatusSocketProvider'

function meta(overrides: Partial<ConnectorMetaDTO> & {connectorId: number}): ConnectorMetaDTO {
    return {
        title: 'A',
        icon: null,
        sslCert: false,
        timeout: 30,
        invoker: {name: 'invoker'},
        status: 'UP',
        lastTestError: null,
        lastCheckedAt: 1,
        ...overrides,
    }
}

describe('ConnectorStatusSocketProvider', () => {
    beforeEach(() => {
        mockStatus = 'connected'
        lastDestination = ''
        lastHandler = null
        dispatchMock.mockClear()
        updateQueryDataMock.mockClear()
        invalidateTagsMock.mockClear()
    })

    it('subscribes to /connector/status', () => {
        render(<ConnectorStatusSocketProvider>{null}</ConnectorStatusSocketProvider>)
        expect(lastDestination).toBe('/connector/status')
    })

    it('invalidates the meta snapshot tag once connected', () => {
        render(<ConnectorStatusSocketProvider>{null}</ConnectorStatusSocketProvider>)
        expect(invalidateTagsMock).toHaveBeenCalledWith([{type: 'Connector', id: 'META_LIST'}])
    })

    it('does not invalidate anything while disconnected', () => {
        mockStatus = 'idle'
        render(<ConnectorStatusSocketProvider>{null}</ConnectorStatusSocketProvider>)
        expect(invalidateTagsMock).not.toHaveBeenCalled()
    })

    it('patches the matching row in the meta cache on a status event', () => {
        render(<ConnectorStatusSocketProvider>{null}</ConnectorStatusSocketProvider>)
        const event = meta({connectorId: 5, status: 'DOWN'})
        act(() => lastHandler!(event))
        expect(updateQueryDataMock).toHaveBeenCalledWith('getConnectorsMeta', undefined, expect.any(Function))

        const recipe = updateQueryDataMock.mock.calls[0][2] as (draft: ConnectorMetaDTO[]) => void
        const draft = [meta({connectorId: 5, status: 'UP'}), meta({connectorId: 9})]
        recipe(draft)
        expect(draft.find((c) => c.connectorId === 5)).toEqual(event)
        expect(draft).toHaveLength(2)
    })

    it('appends a new row when the event connector is not already in the cache', () => {
        render(<ConnectorStatusSocketProvider>{null}</ConnectorStatusSocketProvider>)
        const event = meta({connectorId: 42})
        act(() => lastHandler!(event))

        const recipe = updateQueryDataMock.mock.calls[0][2] as (draft: ConnectorMetaDTO[]) => void
        const draft: ConnectorMetaDTO[] = []
        recipe(draft)
        expect(draft).toEqual([event])
    })
})
