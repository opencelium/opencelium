import { store } from '@app/store/store'
import { dataAggregatorApi } from '@entities/dataAggregator/api/dataAggregatorApi'
import { debouncePromise } from '@shared/utils/debouncePromise'

async function _resolveDataAggregatorIds(input: string): Promise<string[]> {
    const result = await store.dispatch(
        dataAggregatorApi.endpoints.getDataAggregators.initiate(undefined, { subscribe: false })
    )
    if ('data' in result && result.data) {
        return result.data
            .filter((a) => String(a.id).includes(input))
            .map((a) => String(a.id))
    }
    return []
}

export const resolveDataAggregatorIds = debouncePromise(_resolveDataAggregatorIds, 300)
