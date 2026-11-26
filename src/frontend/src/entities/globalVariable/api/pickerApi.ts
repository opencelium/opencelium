import { apiExecutor } from '@shared/api/apiExecutor'
import type { GlobalVariableListItem, PagedResponse, PickerItem, PickerScope } from '../model/types'

const CACHE_MS = 30_000
const ALL_SCOPE_URL = '/global-variable/all?page=0&size=1000&sort=name,asc'

// Not RTK Query: the reference pickers also render inside the method dialog's own legacy Redux
// store, which has no `api` slice (same reason as the workflow's reference validation).
const cache = new Map<string, { at: number; request: Promise<PickerItem[] | null> }>()

export const pickerQueryKey = (scope: PickerScope) => new URLSearchParams(
    Object.entries(scope).map(([key, value]) => [key, String(value)]),
).toString()

const isPickerList = (value: unknown): value is PickerItem[] =>
    Array.isArray(value) && value.every((item) => typeof item === 'object' && item !== null && 'name' in item && 'kind' in item)

const isPagedList = (value: unknown): value is PagedResponse<GlobalVariableListItem> =>
    typeof value === 'object' && value !== null && Array.isArray((value as { content?: unknown }).content)

// Scripts are left out: the list has no parameter detail, and a script needs the field call editor anyway.
const toAllScopeItems = (page: PagedResponse<GlobalVariableListItem>): PickerItem[] => page.content
    .filter((item) => item.scopeType === 'ALL' && item.kind !== 'SCRIPT')
    .map((item): PickerItem => {
        const base = { name: item.name, description: item.description, secret: item.secret, valuePreview: item.valuePreview }
        // Nothing here names a saved workflow, so none of these can be written (the backend says the same).
        return item.kind === 'MUTABLE' ? { ...base, kind: 'MUTABLE', ownerWorkflows: [], writable: false } : { ...base, kind: 'CONSTANT' }
    })

function request(scope: PickerScope): Promise<PickerItem[] | null> {
    const options = { ignoreError: true, skipEntityInvalidation: true }
    if ('allScope' in scope) {
        return apiExecutor({ url: ALL_SCOPE_URL, method: 'GET', options })
            .then((result: unknown) => (isPagedList(result) ? toAllScopeItems(result) : null))
    }
    return apiExecutor({ url: `/global-variable/picker?${pickerQueryKey(scope)}`, method: 'GET', options })
        .then((result: unknown) => (isPickerList(result) ? result : null))
}

export function fetchGlobalVariablePicker(scope: PickerScope): Promise<PickerItem[] | null> {
    const key = pickerQueryKey(scope)
    const cached = cache.get(key)
    if (cached && Date.now() - cached.at < CACHE_MS) return cached.request
    const pending = request(scope)
    cache.set(key, { at: Date.now(), request: pending })
    void pending.then((items) => { if (items === null) cache.delete(key) })
    return pending
}
