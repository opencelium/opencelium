import {useEffect} from "react";
import {initApiErrorNotifySubscriber} from "@shared/errors/api/subscribers/notifySubscriber.ts";
import {initApiAuthErrorSubscriber} from "@shared/errors/api/subscribers/authSubscriber.ts";

export function ErrorProvider({ children }) {
    useEffect(() => {
        initApiErrorNotifySubscriber()
        initApiAuthErrorSubscriber()
    }, [])

    return children
}
