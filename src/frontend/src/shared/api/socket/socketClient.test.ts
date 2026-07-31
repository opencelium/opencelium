import {beforeEach, describe, expect, it, vi} from 'vitest'

const clientCtor = vi.fn()
const activate = vi.fn()
const deactivate = vi.fn().mockResolvedValue(undefined)

vi.mock('@stomp/stompjs', () => ({
    Client: class {
        activate = activate
        deactivate = deactivate
        reconnectDelay = 5000
        constructor(config: unknown) {
            clientCtor(config)
        }
    },
}))

vi.mock('sockjs-client', () => ({
    default: class {
        url: string
        constructor(url: string) {
            this.url = url
        }
    },
}))

import {createSocketClient, destroySocketClient} from './socketClient'

describe('createSocketClient', () => {
    beforeEach(() => {
        clientCtor.mockClear()
        activate.mockClear()
        deactivate.mockClear()
    })

    it('builds a Client with Bearer-prefixed token URL and reconnect delay', () => {
        createSocketClient({token: 'abc 123', url: 'http://api/websocket'})

        expect(clientCtor).toHaveBeenCalledTimes(1)
        const config = clientCtor.mock.calls[0][0]
        expect(config.reconnectDelay).toBe(5000)
        expect(config.connectHeaders['client-id']).toMatch(/^\d+-\d+\.?\d*$/)

        const socket = config.webSocketFactory()
        expect(socket.url).toBe('http://api/websocket?token=Bearer%20abc%20123')
    })

    it('uses caller-provided clientId when given', () => {
        createSocketClient({token: 't', url: 'http://api/websocket', clientId: 'fixed-id'})
        expect(clientCtor.mock.calls[0][0].connectHeaders['client-id']).toBe('fixed-id')
    })

    it('invokes onConnect / onDisconnect / onStompError / onWebSocketError callbacks', () => {
        const onConnect = vi.fn()
        const onDisconnect = vi.fn()
        const onStompError = vi.fn()
        const onWebSocketError = vi.fn()

        createSocketClient({
            token: 't',
            url: 'http://api/websocket',
            onConnect,
            onDisconnect,
            onStompError,
            onWebSocketError,
        })
        const config = clientCtor.mock.calls[0][0]

        config.onConnect()
        config.onDisconnect()
        config.onStompError({headers: {message: 'boom'}, body: ''})
        const wsEvent = new Event('error')
        config.onWebSocketError(wsEvent)

        expect(onConnect).toHaveBeenCalledTimes(1)
        expect(onDisconnect).toHaveBeenCalledTimes(1)
        expect(onStompError).toHaveBeenCalledWith('boom')
        expect(onWebSocketError).toHaveBeenCalledWith(wsEvent)
    })

    it('falls back to a default STOMP error message when header missing', () => {
        const onStompError = vi.fn()
        createSocketClient({token: 't', url: 'http://api/websocket', onStompError})
        const config = clientCtor.mock.calls[0][0]
        config.onStompError({headers: {}, body: ''})
        expect(onStompError).toHaveBeenCalledWith('STOMP error')
    })
})

describe('destroySocketClient', () => {
    it('is a no-op for null', async () => {
        await expect(destroySocketClient(null)).resolves.toBeUndefined()
    })

    it('zeroes reconnectDelay and deactivates the client', async () => {
        const client = {
            reconnectDelay: 5000,
            deactivate: vi.fn().mockResolvedValue(undefined),
        }
        await destroySocketClient(client as never)
        expect(client.reconnectDelay).toBe(0)
        expect(client.deactivate).toHaveBeenCalledTimes(1)
    })
})
