import {type ReactNode, useEffect} from "react"
import {useSocket} from "@shared/api/socket/useSocket"
import {useStompSubscription} from "@shared/api/socket/useStompSubscription"
import {store} from "@app/store/store"
import {connectorApi} from "@entities/connector/api/connectorApi"
import {CONNECTOR_TAG} from "@entities/connector/api/connector.tags"
import type {ConnectorMetaDTO} from "@entities/connector/model/types"

type Props = {children: ReactNode}

/**
 * Keeps the shared GET /connector/meta/all cache (connectorApi.getConnectorsMeta) fresh via
 * the /connector/status broadcast. No context is exposed — every consumer already reads the
 * same RTK Query cache through useGetConnectorsMetaQuery, so this provider is a pure side effect.
 */
export function ConnectorStatusSocketProvider({children}: Props) {
    const {client, status} = useSocket()

    useStompSubscription<ConnectorMetaDTO>(
        client,
        status === 'connected',
        '/connector/status',
        (event) => {
            store.dispatch(
                connectorApi.util.updateQueryData('getConnectorsMeta', undefined, (draft) => {
                    const idx = draft.findIndex((connector) => connector.connectorId === event.connectorId)
                    if (idx >= 0) draft[idx] = event
                    else draft.push(event)
                }),
            )
        },
    )

    // Events during a disconnect are lost forever — the snapshot is the only healing
    // mechanism, so re-fetch it on every (re)connect. invalidateTags only triggers a
    // network refetch if some mounted component is actively subscribed to the query.
    useEffect(() => {
        if (status !== 'connected') return
        store.dispatch(connectorApi.util.invalidateTags([{type: CONNECTOR_TAG, id: 'META_LIST'}]))
    }, [status])

    return <>{children}</>
}
