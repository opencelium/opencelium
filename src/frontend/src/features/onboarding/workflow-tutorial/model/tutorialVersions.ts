import { i18n } from '@shared/i18n/config/i18n'
import type { HistoryVersionItem } from '@features/workflow/types/history.types'

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/**
 * How the tutorial's workflow might have grown, one save per idea it teaches — newest
 * first, as the panel lists them. Spread over several days so the panel's date rows
 * show, and credited to more than one person because the author is half the point.
 */
const SAMPLES: { key: string; author: string; age: number }[] = [
    { key: 'username', author: 'admin', age: 10 * MINUTE },
    { key: 'condition', author: 'admin', age: DAY + 3 * HOUR },
    { key: 'lookup', author: 'support.lead', age: 2 * DAY + 5 * HOUR },
    { key: 'customers', author: 'support.lead', age: 6 * DAY },
]

/**
 * The version history's stand-in contents while the tutorial runs. Rebuilt on every
 * call, so the comments follow the current language and the ages stay relative to now.
 * Snapshot ids are prefixed like the fixtures' negative ids: a request that ever
 * escaped with one would be obviously not real.
 */
export function buildTutorialVersions(): HistoryVersionItem[] {
    const t = i18n.getFixedT(i18n.language, 'onboarding')
    const now = Date.now()
    return SAMPLES.map(({ key, author, age }, index) => {
        const snapshotId = `tutorial-version-${SAMPLES.length - index}`
        return {
            id: snapshotId,
            snapshotId,
            createdAt: now - age,
            author,
            comment: t(`workflow.versionHistory.samples.${key}`),
            current: index === 0,
        }
    })
}
