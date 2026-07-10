import { debouncePromise } from '@shared/utils/debouncePromise'
import { ensureUserMetaLoaded } from '@entities/user/command/userCache'

const SUGGESTION_LIMIT = 20

async function _resolveUserIds(input: string): Promise<string[]> {
    const list = await ensureUserMetaLoaded()
    const needle = (input ?? '').trim()
    const matches = needle
        ? list.filter((u) => String(u.userId).includes(needle))
        : list
    return matches.slice(0, SUGGESTION_LIMIT).map((u) => String(u.userId))
}

export const resolveUserIds = debouncePromise(_resolveUserIds, 300)
