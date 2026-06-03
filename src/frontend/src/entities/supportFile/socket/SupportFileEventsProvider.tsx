import {type ReactNode, useCallback, useMemo, useState} from "react"
import {message} from "antd"
import {useSocket} from "@shared/api/socket/useSocket"
import {useStompSubscription} from "@shared/api/socket/useStompSubscription"
import {useI18n} from "@shared/i18n/hooks/useI18n"
import {
    SupportFileEventsContext,
    type SupportFileEventsContextValue,
} from "./SupportFileEventsContext"

type Props = {children: ReactNode}

export function SupportFileEventsProvider({children}: Props) {
    const {client, status} = useSocket()
    const {t: tEntities} = useI18n('entities')
    const [hasNewSupportFile, setHasNewSupportFile] = useState(false)

    const onSupportFileReady = useCallback(() => {
        setHasNewSupportFile(true)
        message.success(tEntities('support-file.events.created'))
    }, [tEntities])

    useStompSubscription<unknown>(
        client,
        status === 'connected',
        '/execution/support-file',
        onSupportFileReady,
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
