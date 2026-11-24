import type { ChangelogRelease } from '../../src/features/changelog/model/types'

export function parseChangelogRst(text: string, options?: { oldestVersion?: string }): ChangelogRelease[]
export function renderChangelogModule(releases: ChangelogRelease[]): string
