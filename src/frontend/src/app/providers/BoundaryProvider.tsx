import {useEffect} from "react";
import {initBoundaryLogSubscriber} from "@shared/errors/boundary/subscribers/logSubscriber.ts";

export function BoundaryProvider({ children }) {
    useEffect(() => {
        const unsubscribers = [
            initBoundaryLogSubscriber(),
        ]

        return () => {
            unsubscribers.forEach((unsub) => unsub?.())
        }
    }, [])

    return children
}
