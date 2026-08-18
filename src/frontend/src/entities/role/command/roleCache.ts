import { store } from '@app/store/store'
import { genericApi } from '@shared/api/genericApi'

export type RoleMeta = { groupId: number; name: string }

const META_URL = '/role/all'

export async function ensureRoleMetaLoaded(): Promise<RoleMeta[]> {
    const result = await store.dispatch(
        genericApi.endpoints.fetchEntities.initiate(META_URL, { subscribe: false })
    )
    if ('data' in result && Array.isArray(result.data)) {
        return result.data as RoleMeta[]
    }
    return []
}

export function getRoleMetaFromCache(): RoleMeta[] {
    const cache = genericApi.endpoints.fetchEntities.select(META_URL)(store.getState())
    return (cache.data as RoleMeta[] | undefined) ?? []
}

export function findRoleIdByName(name: string): number | undefined {
    return getRoleMetaFromCache().find((r) => r.name === name)?.groupId
}
