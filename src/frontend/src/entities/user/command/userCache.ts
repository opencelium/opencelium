import { store } from '@app/store/store'
import { genericApi } from '@shared/api/genericApi'

export type UserMeta = { userId: number; email: string | null }

const META_URL = '/user/all'

export async function ensureUserMetaLoaded(): Promise<UserMeta[]> {
    const result = await store.dispatch(
        genericApi.endpoints.fetchEntities.initiate(META_URL, { subscribe: false })
    )
    if ('data' in result && Array.isArray(result.data)) {
        return result.data as UserMeta[]
    }
    return []
}

export function getUserMetaFromCache(): UserMeta[] {
    const cache = genericApi.endpoints.fetchEntities.select(META_URL)(store.getState())
    return (cache.data as UserMeta[] | undefined) ?? []
}

export function findUserIdByEmail(email: string): number | undefined {
    return getUserMetaFromCache().find((u) => u.email === email)?.userId
}
