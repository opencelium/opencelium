import {type ReactNode, useMemo, useState} from "react"
import type {Subscription} from "@entities/subscription/model/types"
import {useSocket} from "@shared/api/socket/useSocket"
import {useStompSubscription} from "@shared/api/socket/useStompSubscription"
import {
    CurrentSubscriptionContext,
    type CurrentSubscriptionContextValue,
} from "./CurrentSubscriptionContext"

type Props = {children: ReactNode}

export function CurrentSubscriptionProvider({children}: Props) {
    const {client, status} = useSocket()
    const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null)

    useStompSubscription<Subscription>(
        client,
        status === 'connected',
        '/subscription',
        setCurrentSubscription,
    )

    const value = useMemo<CurrentSubscriptionContextValue>(
        () => ({currentSubscription}),
        [currentSubscription],
    )

    return (
        <CurrentSubscriptionContext.Provider value={value}>
            {children}
        </CurrentSubscriptionContext.Provider>
    )
}
