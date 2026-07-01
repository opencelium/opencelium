import { store } from '@app/store/store'
import { genericApi } from '@shared/api/genericApi'
import type { ConnectionTemplate } from '@entities/connectionTemplate/model/types'

export type ConnectionTemplateMeta = ConnectionTemplate & { templateId?: string | number }

const ALL_URL = '/template/all'

export async function ensureConnectionTemplatesLoaded(): Promise<ConnectionTemplateMeta[]> {
    const result = await store.dispatch(
        genericApi.endpoints.fetchEntities.initiate(ALL_URL, { subscribe: false })
    )
    if ('data' in result && Array.isArray(result.data)) {
        return result.data as ConnectionTemplateMeta[]
    }
    return []
}

export function findConnectionTemplateIdByName(
    templates: ConnectionTemplateMeta[],
    name: string,
): string | number | undefined {
    const match = templates.find((t) => t.name === name)
    return match?.templateId ?? match?.id
}
