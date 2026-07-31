import { store } from '@app/store/store'
import { genericApi } from '@shared/api/genericApi'

export type ConnectorMeta = { connectorId: number; title: string }

const META_URL = '/connector/all'

export async function ensureConnectorMetaLoaded(): Promise<ConnectorMeta[]> {
    const result = await store.dispatch(
        genericApi.endpoints.fetchEntities.initiate(META_URL, { subscribe: false })
    )
    if ('data' in result && Array.isArray(result.data)) {
        return result.data as ConnectorMeta[]
    }
    return []
}

export function getConnectorMetaFromCache(): ConnectorMeta[] {
    const cache = genericApi.endpoints.fetchEntities.select(META_URL)(store.getState())
    return (cache.data as ConnectorMeta[] | undefined) ?? []
}

export function findConnectorIdByTitle(title: string): number | undefined {
    return getConnectorMetaFromCache().find((c) => c.title === title)?.connectorId
}
