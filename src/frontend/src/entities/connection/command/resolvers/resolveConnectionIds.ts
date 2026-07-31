import { debouncePromise } from '@shared/utils/debouncePromise'
import { ensureConnectionMetaLoaded } from '@entities/connection/command/connectionCache'

const SUGGESTION_LIMIT = 20

async function _resolveConnectionIds(input: string): Promise<string[]> {
    const list = await ensureConnectionMetaLoaded()
    const needle = (input ?? '').trim()
    const matches = needle
        ? list.filter((c) => String(c.id).includes(needle))
        : list
    return matches.slice(0, SUGGESTION_LIMIT).map((c) => String(c.id))
}

export const resolveConnectionIds = debouncePromise(_resolveConnectionIds, 300)
