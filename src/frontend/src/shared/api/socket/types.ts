import type {Client} from "@stomp/stompjs"

export type SocketStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error'

export type SocketContextValue = {
    client: Client | null
    status: SocketStatus
    error: string | null
}
