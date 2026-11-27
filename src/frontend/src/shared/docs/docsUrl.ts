// Every docs page the app links to. A closed set, so a renamed page shows up as a compile error at each link.
export type DocsPage =
    | ''
    | 'start/whats-new-5-1'
    | 'start/whats-new-5-2'
    | 'start/whats-new-5-3'
    | 'guides/build-a-workflow'
    | 'guides/check-a-workflow'
    | 'guides/configure-the-system'
    | 'guides/global-variables'
    | 'guides/request-playground'
    | 'guides/schedule-and-notify'
    | 'guides/script-playground'
    | 'guides/send-notifications'
    | 'guides/users-and-permissions'
    | 'concepts/data-mapping'
    | 'operations/backup-and-restore'
    | 'operations/updating'
    | 'reference/configuration'
    | 'reference/permissions'

/** The published docs version every link points at. Switch it here, never at a link. */
export const DOCS_BASE_URL = 'https://docs.opencelium.io/en/prod/'

export const docsUrl = (page: DocsPage, anchor?: string): string =>
    `${DOCS_BASE_URL}${page ? `${page}.html` : ''}${anchor ? `#${anchor}` : ''}`

export const openDocs = (page: DocsPage, anchor?: string): void => {
    window.open(docsUrl(page, anchor), '_blank', 'noopener,noreferrer')
}
