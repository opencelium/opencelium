import { store } from '@app/store/store'
import { categoryApi } from '@entities/category/api/categoryApi'
import { debouncePromise } from '@shared/utils/debouncePromise'

async function _resolveCategoryNames(input: string): Promise<string[]> {
    const result = await store.dispatch(
        categoryApi.endpoints.getCategories.initiate(undefined, { subscribe: false })
    )
    if ('data' in result && result.data) {
        return result.data
            .filter((c) => c.name.toLowerCase().includes(input.toLowerCase()))
            .map((c) => c.name)
    }
    return []
}

export const resolveCategoryNames = debouncePromise(_resolveCategoryNames, 300)
