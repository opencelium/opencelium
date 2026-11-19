import { debouncePromise } from '@shared/utils/debouncePromise'
import { rememberGlobalVariables, searchGlobalVariables } from '../globalVariableCache'

async function _resolveGlobalVariableIds(input: string): Promise<string[]> {
    const items = await searchGlobalVariables('')
    rememberGlobalVariables(items)
    return items.map((item) => String(item.id)).filter((id) => id.includes(input))
}

export const resolveGlobalVariableIds = debouncePromise(_resolveGlobalVariableIds, 300)
