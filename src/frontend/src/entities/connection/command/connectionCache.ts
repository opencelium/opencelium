import { store } from '@app/store/store'
import { genericApi } from '@shared/api/genericApi'

export type ConnectionMeta = { id: number; title: string; description?: string }

const META_URL = '/connection/all/meta'

export async function ensureConnectionMetaLoaded(): Promise<ConnectionMeta[]> {
    const result = await store.dispatch(
        genericApi.endpoints.fetchEntities.initiate(META_URL, { subscribe: false })
    )
    if ('data' in result && Array.isArray(result.data)) {
        return result.data as ConnectionMeta[]
    }
    return []
}

export function getConnectionMetaFromCache(): ConnectionMeta[] {
    const cache = genericApi.endpoints.fetchEntities.select(META_URL)(store.getState())
    return (cache.data as ConnectionMeta[] | undefined) ?? []
}

export function findConnectionIdByTitle(title: string): number | undefined {
    return getConnectionMetaFromCache().find((c) => c.title === title)?.id
}
