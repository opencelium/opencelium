import { store } from '@app/store/store'
import { categoryApi } from '@entities/category/api/categoryApi'
import { debouncePromise } from '@shared/utils/debouncePromise'

async function _resolveCategoryIds(input: string): Promise<string[]> {
    const result = await store.dispatch(
        categoryApi.endpoints.getCategories.initiate(undefined, { subscribe: false })
    )
    if ('data' in result && result.data) {
        return result.data
            .filter((c) => String(c.id).includes(input))
            .map((c) => String(c.id))
    }
    return []
}

export const resolveCategoryIds = debouncePromise(_resolveCategoryIds, 300)
