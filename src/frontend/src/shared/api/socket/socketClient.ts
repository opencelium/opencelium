import {Client} from "@stomp/stompjs"
import SockJS from "sockjs-client"

type CreateSocketClientArgs = {
    token: string
    url: string
    clientId?: string
    onConnect?: () => void
    onDisconnect?: () => void
    onStompError?: (message: string) => void
    onWebSocketError?: (event: Event) => void
}

const debug = (...args: unknown[]) => {
    if (import.meta.env.DEV) console.debug('[socket]', ...args)
}

export function createSocketClient({
    token,
    url,
    clientId,
    onConnect,
    onDisconnect,
    onStompError,
    onWebSocketError,
}: CreateSocketClientArgs): Client {
    const resolvedClientId = clientId ?? `${Date.now()}-${Math.random()}`

    return new Client({
        webSocketFactory: () => new SockJS(`${url}?token=${encodeURIComponent(`Bearer ${token}`)}`),
        reconnectDelay: 5000,
        connectHeaders: {
            'client-id': resolvedClientId,
        },
        debug: (str) => debug(str),
        onConnect: () => {
            debug('connected')
            onConnect?.()
        },
        onDisconnect: () => {
            debug('disconnected')
            onDisconnect?.()
        },
        onStompError: (frame) => {
            const message = frame.headers['message'] ?? 'STOMP error'
            console.error('[socket] STOMP error', message, frame.body)
            onStompError?.(message)
        },
        onWebSocketError: (event) => {
            console.error('[socket] WebSocket error', event)
            onWebSocketError?.(event)
        },
    })
}

export async function destroySocketClient(client: Client | null): Promise<void> {
    if (!client) return
    client.reconnectDelay = 0
    await client.deactivate()
}
