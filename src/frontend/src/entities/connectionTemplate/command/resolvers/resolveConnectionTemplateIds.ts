import { store } from '@app/store/store'
import { genericApi } from '@shared/api/genericApi'
import { debouncePromise } from '@shared/utils/debouncePromise'
import type { ConnectionTemplate } from '@entities/connectionTemplate/model/types'

const ALL_URL = '/template/all'

async function _resolveConnectionTemplateIds(input: string): Promise<string[]> {
    const result = await store.dispatch(
        genericApi.endpoints.fetchEntities.initiate(ALL_URL, { subscribe: false })
    )
    if ('data' in result && Array.isArray(result.data)) {
        const needle = (input ?? '').toLowerCase()
        return (result.data as (ConnectionTemplate & { templateId?: string | number })[])
            .map((t) => String(t.templateId ?? t.id))
            .filter((id) => id.toLowerCase().includes(needle))
    }
    return []
}

export const resolveConnectionTemplateIds = debouncePromise(_resolveConnectionTemplateIds, 300)
