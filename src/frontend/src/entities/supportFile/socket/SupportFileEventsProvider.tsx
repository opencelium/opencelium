import {type ReactNode, useCallback, useMemo, useState} from "react"
import {useSocket} from "@shared/api/socket/useSocket"
import {useStompSubscription} from "@shared/api/socket/useStompSubscription"
import {
    SupportFileEventsContext,
    type SupportFileEventsContextValue,
} from "./SupportFileEventsContext"

type Props = {children: ReactNode}

export function SupportFileEventsProvider({children}: Props) {
    const {client, status} = useSocket()
    const [hasNewSupportFile, setHasNewSupportFile] = useState(false)

    useStompSubscription<unknown>(
        client,
        status === 'connected',
        '/execution/support-file',
        () => setHasNewSupportFile(true),
    )

    const clear = useCallback(() => setHasNewSupportFile(false), [])

    const value = useMemo<SupportFileEventsContextValue>(
        () => ({hasNewSupportFile, clear}),
        [hasNewSupportFile, clear],
    )

    return (
        <SupportFileEventsContext.Provider value={value}>
            {children}
        </SupportFileEventsContext.Provider>
    )
}
