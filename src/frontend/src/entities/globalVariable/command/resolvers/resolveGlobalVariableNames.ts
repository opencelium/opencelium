import { debouncePromise } from '@shared/utils/debouncePromise'
import { rememberGlobalVariables, searchGlobalVariables } from '../globalVariableCache'

async function _resolveGlobalVariableNames(input: string): Promise<string[]> {
    const items = await searchGlobalVariables(input)
    rememberGlobalVariables(items)
    return items.map((item) => item.name)
}

export const resolveGlobalVariableNames = debouncePromise(_resolveGlobalVariableNames, 300)
