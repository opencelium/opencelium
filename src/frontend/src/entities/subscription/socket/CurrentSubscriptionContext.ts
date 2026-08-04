import {createContext} from "react"
import type {Subscription} from "@entities/subscription/model/types"

export type CurrentSubscriptionContextValue = {
    currentSubscription: Subscription | null
}

export const CurrentSubscriptionContext = createContext<CurrentSubscriptionContextValue>({
    currentSubscription: null,
})
