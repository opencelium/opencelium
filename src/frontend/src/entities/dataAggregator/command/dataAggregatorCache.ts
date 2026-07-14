import { store } from '@app/store/store'
import { dataAggregatorApi } from '@entities/dataAggregator/api/dataAggregatorApi'
import type { DataAggregator } from '@entities/dataAggregator/model/types'

export function getDataAggregatorsFromCache(): DataAggregator[] {
    return dataAggregatorApi.endpoints.getDataAggregators.select(undefined)(store.getState()).data ?? []
}

export function findDataAggregatorIdByName(name: string): number | undefined {
    return getDataAggregatorsFromCache().find((a) => a.name === name)?.id
}
