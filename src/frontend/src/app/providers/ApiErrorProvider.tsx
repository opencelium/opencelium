import {useEffect} from "react";
import {initApiErrorNotifySubscriber} from "@shared/errors/api/subscribers/notifySubscriber.ts";
import {initApiAuthErrorSubscriber} from "@shared/errors/api/subscribers/authSubscriber.ts";
import {useI18n} from "@shared/i18n/hooks/useI18n.ts";

export function ApiErrorProvider({ children }) {
    useEffect(() => {
        const unsubscribers = [
            initApiErrorNotifySubscriber(),
            initApiAuthErrorSubscriber(),
        ]

        return () => {
            unsubscribers.forEach((unsub) => unsub?.())
        }
    }, [])

    return children
}
