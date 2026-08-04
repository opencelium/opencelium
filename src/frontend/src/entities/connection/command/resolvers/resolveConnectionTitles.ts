import { debouncePromise } from '@shared/utils/debouncePromise'
import { ensureConnectionMetaLoaded } from '@entities/connection/command/connectionCache'

const SUGGESTION_LIMIT = 20

async function _resolveConnectionTitles(input: string): Promise<string[]> {
    const list = await ensureConnectionMetaLoaded()
    const needle = (input ?? '').toLowerCase()
    const matches = needle
        ? list.filter((c) => c.title.toLowerCase().includes(needle))
        : list
    return matches.slice(0, SUGGESTION_LIMIT).map((c) => c.title)
}

export const resolveConnectionTitles = debouncePromise(_resolveConnectionTitles, 300)
