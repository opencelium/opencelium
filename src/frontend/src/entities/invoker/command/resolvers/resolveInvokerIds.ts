import { store } from '@app/store/store'
import { invokerApi } from '@entities/invoker/api/invokerApi'
import { debouncePromise } from '@shared/utils/debouncePromise'

async function _resolveInvokerIds(input: string): Promise<string[]> {
    const result = await store.dispatch(
        invokerApi.endpoints.getInvokers.initiate(undefined, { subscribe: false })
    )
    if ('data' in result && result.data) {
        return result.data
            .filter((inv) => inv.name.toLowerCase().includes(input.toLowerCase()))
            .map((inv) => inv.name)
    }
    return []
}

export const resolveInvokerIds = debouncePromise(_resolveInvokerIds, 300)
