import type { ChangelogRelease, ChangelogView } from '@features/changelog/model/types'

/** `v5.2.0` and `5.2` name the same release. */
export function normalizeVersion(version: string): string {
    return version.trim().replace(/^v/i, '').replace(/(\.0)+$/, '')
}

export function buildChangelogView(releases: ChangelogRelease[], runningVersion?: string): ChangelogView {
    if (releases.length === 0) return { current: null, previous: [] }

    const running = runningVersion ? normalizeVersion(runningVersion) : null
    const installed = running ? releases.find((r) => normalizeVersion(r.version) === running) : undefined
    const current = installed ?? releases[0]

    return {
        current: { release: current, kind: installed ? 'installed' : 'latest' },
        previous: releases.filter((r) => r !== current),
    }
}

const TICKET_SUFFIX = /\s*\(((?:OC-\d+)(?:,\s*OC-\d+)*)\)\s*$/

export function splitTicket(item: string): { text: string; ticket: string | null } {
    const match = TICKET_SUFFIX.exec(item)
    if (!match) return { text: item, ticket: null }
    return { text: item.slice(0, match.index), ticket: match[1] }
}

export function formatReleaseDate(isoDate: string, language: string): string {
    const [year, month, day] = isoDate.split('-').map(Number)
    // Built from parts rather than parsed, so the date never shifts a day across time zones.
    const date = new Date(year, month - 1, day)
    if (Number.isNaN(date.getTime())) return isoDate
    return new Intl.DateTimeFormat(language, { year: 'numeric', month: 'long', day: 'numeric' }).format(date)
}

export function countItems(release: ChangelogRelease, kind: ChangelogRelease['sections'][number]['kind']): number {
    return release.sections
        .filter((s) => s.kind === kind)
        .reduce((sum, s) => sum + s.items.length, 0)
}
