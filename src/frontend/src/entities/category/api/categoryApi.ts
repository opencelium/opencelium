import { baseApi } from '@shared/api/baseApi'
import type { Category } from '../model/types'
import { CATEGORY_TAG } from './category.tags'

export const categoryApi = baseApi.injectEndpoints({
    endpoints: (b) => ({
        getCategories: b.query<Category[], void>({
            query: () => '/category/all',
            providesTags: (result) =>
                result
                    ? [
                        { type: CATEGORY_TAG, id: 'LIST' },
                        { type: 'Entity' as any, id: '/category/all' },
                        ...result.map((c) => ({ type: CATEGORY_TAG, id: c.id })),
                      ]
                    : [{ type: CATEGORY_TAG, id: 'LIST' }],
        }),
    }),
})

export const { useGetCategoriesQuery } = categoryApi
