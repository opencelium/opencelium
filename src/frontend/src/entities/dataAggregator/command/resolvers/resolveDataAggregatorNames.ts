import { store } from '@app/store/store'
import { dataAggregatorApi } from '@entities/dataAggregator/api/dataAggregatorApi'
import { debouncePromise } from '@shared/utils/debouncePromise'

async function _resolveDataAggregatorNames(input: string): Promise<string[]> {
    const result = await store.dispatch(
        dataAggregatorApi.endpoints.getDataAggregators.initiate(undefined, { subscribe: false })
    )
    if ('data' in result && result.data) {
        return result.data
            .filter((a) => a.name.toLowerCase().includes(input.toLowerCase()))
            .map((a) => a.name)
    }
    return []
}

export const resolveDataAggregatorNames = debouncePromise(_resolveDataAggregatorNames, 300)
