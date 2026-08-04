import { store } from '@app/store/store'
import { genericApi } from '@shared/api/genericApi'
import type { Aggregator } from '../model/types'

export function getAggregatorsFromCache(): Aggregator[] {
    const state = store.getState()
    const result = genericApi.endpoints.fetchEntities.select('/aggregator/all')(state as any)
    return (result.data as Aggregator[] | undefined) ?? []
}
