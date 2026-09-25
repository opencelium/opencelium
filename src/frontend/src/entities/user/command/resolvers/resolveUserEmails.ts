import { debouncePromise } from '@shared/utils/debouncePromise'
import { ensureUserMetaLoaded } from '@entities/user/command/userCache'

const SUGGESTION_LIMIT = 20

// Exported (unlike its sibling resolvers) because resolveRoleNames.ts imports it directly.
export async function _resolveUserEmails(input: string): Promise<string[]> {
    const list = await ensureUserMetaLoaded()
    // An account that signs in with a username only has nothing to suggest here —
    // the by-email commands address users by their email and skip those.
    const emails = list.map((u) => u.email).filter((email): email is string => Boolean(email))
    const needle = (input ?? '').toLowerCase()
    const matches = needle
        ? emails.filter((email) => email.toLowerCase().includes(needle))
        : emails
    return matches.slice(0, SUGGESTION_LIMIT)
}

export const resolveUserEmails = debouncePromise(_resolveUserEmails, 300)
