import { store } from '@app/store/store'
import { categoryApi } from '@entities/category/api/categoryApi'
import type { Category } from '@entities/category/model/types'

export function getCategoriesFromCache(): Category[] {
    return categoryApi.endpoints.getCategories.select(undefined)(store.getState()).data ?? []
}

export function findCategoryIdByName(name: string): number | undefined {
    return getCategoriesFromCache().find((c) => c.name === name)?.id
}
