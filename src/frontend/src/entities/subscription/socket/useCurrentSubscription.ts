import {useContext} from "react"
import {CurrentSubscriptionContext} from "./CurrentSubscriptionContext"

export function useCurrentSubscription() {
    return useContext(CurrentSubscriptionContext)
}
