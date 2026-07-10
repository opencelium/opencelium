import { debouncePromise } from '@shared/utils/debouncePromise'
import { ensureUserMetaLoaded } from '@entities/user/command/userCache'

const SUGGESTION_LIMIT = 20

// Exported (unlike its sibling resolvers) because resolveRoleNames.ts imports it directly.
export async function _resolveUserEmails(input: string): Promise<string[]> {
    const list = await ensureUserMetaLoaded()
    const needle = (input ?? '').toLowerCase()
    const matches = needle
        ? list.filter((u) => u.email.toLowerCase().includes(needle))
        : list
    return matches.slice(0, SUGGESTION_LIMIT).map((u) => u.email)
}

export const resolveUserEmails = debouncePromise(_resolveUserEmails, 300)
