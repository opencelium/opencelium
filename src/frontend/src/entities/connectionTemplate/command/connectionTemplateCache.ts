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

const SUGGESTION_ID_PATTERN = /\(#([^()]+)\)$/

// Template names are not unique, but templateId is — the suggestion string
// carries the id so a duplicate name can still be picked unambiguously.
export function formatConnectionTemplateSuggestion(template: ConnectionTemplateMeta): string {
    const id = template.templateId ?? template.id
    return `${template.name} (#${id})`
}

export function extractTemplateIdFromSuggestion(value: string): string | undefined {
    return value.match(SUGGESTION_ID_PATTERN)?.[1]
}
