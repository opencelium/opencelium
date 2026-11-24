import { store } from '@app/store/store'
import { globalVariableApi } from '@entities/globalVariable/api/globalVariableApi'
import type { GlobalVariableListItem } from '@entities/globalVariable/model/types'

const PALETTE_PAGE_SIZE = 20

export async function searchGlobalVariables(search: string): Promise<GlobalVariableListItem[]> {
    const result = await store.dispatch(
        globalVariableApi.endpoints.searchGlobalVariables.initiate(
            { page: 0, size: PALETTE_PAGE_SIZE, sort: 'name,asc', search },
            { subscribe: false },
        ),
    )
    return 'data' in result && result.data ? result.data.content : []
}

// The palette shows names; URLs need ids, so resolve against the last search that listed the name.
const idsByName = new Map<string, number>()

export function rememberGlobalVariables(items: GlobalVariableListItem[]) {
    items.forEach((item) => idsByName.set(item.name, item.id))
}

export const resolveGlobalVariableId = (value: string): string =>
    /^\d+$/.test(value) ? value : String(idsByName.get(value) ?? value)
