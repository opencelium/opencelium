import { baseApi } from '@shared/api/baseApi'
import type { DataAggregator } from '../model/types'
import { DATA_AGGREGATOR_TAG } from './dataAggregator.tags'

export const dataAggregatorApi = baseApi.injectEndpoints({
    endpoints: (b) => ({
        getDataAggregators: b.query<DataAggregator[], void>({
            query: () => '/aggregator/all',
            providesTags: (result) =>
                result
                    ? [
                        { type: DATA_AGGREGATOR_TAG, id: 'LIST' },
                        { type: 'Entity' as any, id: '/aggregator/all' },
                        ...result.map((a) => ({ type: DATA_AGGREGATOR_TAG, id: a.id })),
                      ]
                    : [{ type: DATA_AGGREGATOR_TAG, id: 'LIST' }],
        }),
    }),
})

export const { useGetDataAggregatorsQuery } = dataAggregatorApi
