import { useGetConnectorsMetaQuery } from '@entities/connector/api/connectorApi'
import type { ConnectorHealth } from '@entities/connector/model/types'

/**
 * Live health for one connector, kept fresh by ConnectorStatusSocketProvider patching
 * the same getConnectorsMeta cache from /connector/status events. Falls back to
 * undefined until the snapshot loads — callers should fall back to whatever
 * status/lastTestError/lastCheckedAt they already have baked into their own data.
 */
export function useLiveConnectorStatus(connectorId: number | undefined): ConnectorHealth | undefined {
    const { data: connectorsMeta } = useGetConnectorsMetaQuery(undefined, { skip: connectorId == null })
    if (connectorId == null) return undefined
    return connectorsMeta?.find((connector) => connector.connectorId === connectorId)
}
