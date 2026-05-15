import {type ReactNode, useEffect, useMemo, useRef, useState} from "react"
import type {Client} from "@stomp/stompjs"
import {useAppSelector} from "@shared/lib/storeHooks"
import {selectAccessToken} from "@entities/auth/model/authSelectors"
import {createSocketClient, destroySocketClient} from "./socketClient"
import {SocketContext} from "./SocketContext"
import type {SocketContextValue, SocketStatus} from "./types"

type Props = {children: ReactNode}

const SOCKET_URL =
    import.meta.env.VITE_SOCKET_URL ?? `${import.meta.env.VITE_API_URL}/websocket`

export function SocketTransportProvider({children}: Props) {
    const token = useAppSelector(selectAccessToken)
    const [client, setClient] = useState<Client | null>(null)
    const [status, setStatus] = useState<SocketStatus>('idle')
    const [error, setError] = useState<string | null>(null)
    const activeClientRef = useRef<Client | null>(null)

    useEffect(() => {
        if (!token) {
            const toDestroy = activeClientRef.current
            activeClientRef.current = null
            setClient(null)
            setStatus('idle')
            setError(null)
            destroySocketClient(toDestroy).catch(() => {})
            return
        }

        setStatus('connecting')
        setError(null)
        const next = createSocketClient({
            token,
            url: SOCKET_URL,
            onConnect: () => setStatus('connected'),
            onDisconnect: () => setStatus('disconnected'),
            onStompError: (message) => {
                setError(message)
                setStatus('error')
            },
            onWebSocketError: () => {
                setError('WebSocket connection error')
                setStatus('error')
            },
        })
        activeClientRef.current = next
        setClient(next)
        next.activate()

        return () => {
            activeClientRef.current = null
            destroySocketClient(next).catch(() => {})
        }
    }, [token])

    const value = useMemo<SocketContextValue>(
        () => ({client, status, error}),
        [client, status, error],
    )

    return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
}
