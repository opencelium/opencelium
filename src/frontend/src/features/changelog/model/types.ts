export type ChangelogSectionKind = 'features' | 'fixes'

export type ChangelogSection = {
    kind: ChangelogSectionKind
    items: string[]
}

export type ChangelogRelease = {
    version: string
    /** ISO calendar date, `YYYY-MM-DD`. */
    date: string
    isMajor?: boolean
    sections: ChangelogSection[]
}

/**
 * `installed` — the release matches the version the backend reports.
 * `latest` — the running version is unknown or not listed, so the newest entry stands in.
 */
export type CurrentReleaseKind = 'installed' | 'latest'

export type ChangelogView = {
    current: { release: ChangelogRelease; kind: CurrentReleaseKind } | null
    previous: ChangelogRelease[]
}
