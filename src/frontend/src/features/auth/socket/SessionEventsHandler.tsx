import {useEffect, useRef} from "react"
import {useAppDispatch} from "@shared/lib/storeHooks"
import {authActions} from "@entities/auth/model/authSlice"
import {useSocket} from "@shared/api/socket/useSocket"
import {useStompSubscription} from "@shared/api/socket/useStompSubscription"

type SessionEvent = {event: 'FORCE_LOGOUT' | string}

const SESSION_CHANNEL_NAME = 'session-events'

export function SessionEventsHandler() {
    const dispatch = useAppDispatch()
    const {client, status} = useSocket()
    const isConnected = status === 'connected'
    const broadcastRef = useRef<BroadcastChannel | null>(null)

    useEffect(() => {
        const channel = new BroadcastChannel(SESSION_CHANNEL_NAME)
        broadcastRef.current = channel

        channel.onmessage = (event: MessageEvent<{type: string; payload?: {action: string}}>) => {
            if (event.data?.type === 'SESSION_UPDATE' && event.data.payload?.action === 'LOGOUT') {
                dispatch(authActions.clearSession())
            }
        }

        return () => {
            channel.close()
            broadcastRef.current = null
        }
    }, [dispatch])

    useStompSubscription<SessionEvent>(client, isConnected, '/user/session', (data) => {
        if (data.event === 'FORCE_LOGOUT') {
            dispatch(authActions.clearSession())
            broadcastRef.current?.postMessage({
                type: 'SESSION_UPDATE',
                payload: {action: 'LOGOUT'},
            })
        }
    })

    return null
}
