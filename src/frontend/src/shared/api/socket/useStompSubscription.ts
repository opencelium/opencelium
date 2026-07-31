import {useEffect, useRef} from "react"
import type {Client, IMessage} from "@stomp/stompjs"

export function useStompSubscription<T>(
    client: Client | null,
    isConnected: boolean,
    destination: string,
    onMessage: (data: T) => void,
): void {
    const handlerRef = useRef(onMessage)
    handlerRef.current = onMessage

    useEffect(() => {
        if (!client || !isConnected) return

        const subscription = client.subscribe(destination, (message: IMessage) => {
            try {
                const data = JSON.parse(message.body) as T
                handlerRef.current(data)
            } catch (err) {
                console.error(`[socket] Failed to parse message on ${destination}`, err)
            }
        })

        if (import.meta.env.DEV) console.debug('[socket] subscribed', destination)

        return () => {
            subscription.unsubscribe()
            if (import.meta.env.DEV) console.debug('[socket] unsubscribed', destination)
        }
    }, [client, isConnected, destination])
}
