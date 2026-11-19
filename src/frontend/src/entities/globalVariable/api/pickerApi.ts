import { apiExecutor } from '@shared/api/apiExecutor'
import type { PickerItem, PickerQuery } from '../model/types'

const CACHE_MS = 30_000

// Not RTK Query: the reference pickers also render inside the method dialog's own legacy Redux
// store, which has no `api` slice (same reason as the workflow's reference validation).
const cache = new Map<string, { at: number; request: Promise<PickerItem[] | null> }>()

export const pickerQueryKey = (query: PickerQuery) => new URLSearchParams(
    Object.entries(query).map(([key, value]) => [key, String(value)]),
).toString()

const isPickerList = (value: unknown): value is PickerItem[] =>
    Array.isArray(value) && value.every((item) => typeof item === 'object' && item !== null && 'name' in item && 'kind' in item)

export function fetchGlobalVariablePicker(query: PickerQuery): Promise<PickerItem[] | null> {
    const key = pickerQueryKey(query)
    const cached = cache.get(key)
    if (cached && Date.now() - cached.at < CACHE_MS) return cached.request
    const request = apiExecutor({
        url: `/global-variable/picker?${key}`,
        method: 'GET',
        options: { ignoreError: true, skipEntityInvalidation: true },
    }).then((result: unknown) => (isPickerList(result) ? result : null))
    cache.set(key, { at: Date.now(), request })
    request.then((items) => { if (items === null) cache.delete(key) })
    return request
}
