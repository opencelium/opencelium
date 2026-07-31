import {beforeEach, describe, expect, it, vi} from 'vitest'
import {act, render} from '@testing-library/react'
import {useEffect} from 'react'
import type {Client} from '@stomp/stompjs'

type Callbacks = {
    onConnect?: () => void
    onDisconnect?: () => void
    onStompError?: (message: string) => void
    onWebSocketError?: (event: Event) => void
}

const createSocketClient = vi.fn()
const destroySocketClient = vi.fn().mockResolvedValue(undefined)

vi.mock('./socketClient', () => ({
    createSocketClient: (args: Callbacks) => createSocketClient(args),
    destroySocketClient: (client: Client | null) => destroySocketClient(client),
}))

let mockToken: string | null = null
vi.mock('@shared/lib/storeHooks', () => ({
    useAppSelector: (selector: (state: unknown) => unknown) =>
        selector({auth: {session: mockToken ? {accessToken: mockToken} : null, status: 'idle'}}),
}))

import {SocketTransportProvider} from './SocketTransportProvider'
import {useSocket} from './useSocket'
import type {SocketContextValue} from './types'

function StatusProbe({onValue}: {onValue: (value: SocketContextValue) => void}) {
    const value = useSocket()
    useEffect(() => {
        onValue(value)
    }, [value, onValue])
    return null
}

function setup() {
    let latest: SocketContextValue = {client: null, status: 'idle', error: null}
    const result = render(
        <SocketTransportProvider>
            <StatusProbe onValue={(v) => (latest = v)} />
        </SocketTransportProvider>,
    )
    return {result, getLatest: () => latest}
}

describe('SocketTransportProvider', () => {
    beforeEach(() => {
        createSocketClient.mockReset()
        destroySocketClient.mockClear()
        mockToken = null
        createSocketClient.mockImplementation((args: Callbacks) => {
            const fakeClient = {
                activate: vi.fn(),
                deactivate: vi.fn().mockResolvedValue(undefined),
                reconnectDelay: 5000,
                _cb: args,
            }
            return fakeClient
        })
    })

    it('stays idle without a token', () => {
        const {getLatest} = setup()
        expect(getLatest().status).toBe('idle')
        expect(getLatest().client).toBeNull()
        expect(createSocketClient).not.toHaveBeenCalled()
    })

    it('creates and activates a client when token is present', () => {
        mockToken = 'tok'
        const {getLatest} = setup()
        expect(createSocketClient).toHaveBeenCalledTimes(1)
        const created = createSocketClient.mock.results[0].value
        expect(created.activate).toHaveBeenCalledTimes(1)
        expect(getLatest().client).toBe(created)
        expect(getLatest().status).toBe('connecting')
    })

    it('transitions status on connect / disconnect / stomp error / websocket error', () => {
        mockToken = 'tok'
        const {getLatest} = setup()
        const cb = (createSocketClient.mock.calls[0][0] as Callbacks)

        act(() => cb.onConnect!())
        expect(getLatest().status).toBe('connected')

        act(() => cb.onDisconnect!())
        expect(getLatest().status).toBe('disconnected')

        act(() => cb.onStompError!('boom'))
        expect(getLatest().status).toBe('error')
        expect(getLatest().error).toBe('boom')

        act(() => cb.onWebSocketError!(new Event('e')))
        expect(getLatest().error).toBe('WebSocket connection error')
    })

    it('destroys the client when unmounted', () => {
        mockToken = 'tok'
        const {result} = setup()
        const created = createSocketClient.mock.results[0].value
        result.unmount()
        expect(destroySocketClient).toHaveBeenCalledWith(created)
    })
})
