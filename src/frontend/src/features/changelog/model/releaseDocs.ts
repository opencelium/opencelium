import type { DocsPage } from '@shared/docs/docsUrl'

export type ReleaseDocs = {
    page: DocsPage
    /** The section on what to check before upgrading, when the release has one. */
    upgradeAnchor?: string
}

// Kept beside the generated changelog data, which is rebuilt from CHANGELOG.rst and must not be edited.
const RELEASE_DOCS: Record<string, ReleaseDocs> = {
    '5.3': { page: 'start/whats-new-5-3', upgradeAnchor: 'whats-new-5-3-upgrade' },
    '5.2': { page: 'start/whats-new-5-2' },
    '5.1': { page: 'start/whats-new-5-1' },
}

export const getReleaseDocs = (version: string): ReleaseDocs | undefined => RELEASE_DOCS[version]
