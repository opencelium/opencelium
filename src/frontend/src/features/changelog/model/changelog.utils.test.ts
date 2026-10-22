import { describe, expect, it } from 'vitest'
import { buildChangelogView, countItems, formatReleaseDate, normalizeVersion, splitTicket } from '@features/changelog/model/changelog.utils'
import type { ChangelogRelease } from '@features/changelog/model/types'

const release = (version: string): ChangelogRelease => ({
    version,
    date: '2026-01-01',
    sections: [
        { kind: 'features', items: ['A', 'B'] },
        { kind: 'fixes', items: ['C (OC-1)'] },
    ],
})

const releases = [release('5.2'), release('5.1'), release('5.0')]

describe('normalizeVersion', () => {
    it('treats a patch-zero and a v-prefix as the same release', () => {
        expect(normalizeVersion('v5.2.0')).toBe(normalizeVersion('5.2'))
        expect(normalizeVersion(' 4.8.1 ')).toBe('4.8.1')
    })
})

describe('buildChangelogView', () => {
    it('focuses the installed release and lists every other one as previous', () => {
        const view = buildChangelogView(releases, '5.1.0')
        expect(view.current).toEqual({ release: releases[1], kind: 'installed' })
        expect(view.previous.map((r) => r.version)).toEqual(['5.2', '5.0'])
    })

    it('falls back to the newest release when the running version is unknown or unlisted', () => {
        expect(buildChangelogView(releases).current).toEqual({ release: releases[0], kind: 'latest' })
        expect(buildChangelogView(releases, '9.9').current?.kind).toBe('latest')
    })

    it('returns no current release for an empty changelog', () => {
        expect(buildChangelogView([], '5.2')).toEqual({ current: null, previous: [] })
    })
})

describe('splitTicket', () => {
    it('pulls a trailing ticket reference out of the text', () => {
        expect(splitTicket('Fix the thing (OC-1539)')).toEqual({ text: 'Fix the thing', ticket: 'OC-1539' })
        expect(splitTicket('Fix (step 2) in the wizard')).toEqual({ text: 'Fix (step 2) in the wizard', ticket: null })
    })
})

describe('formatReleaseDate / countItems', () => {
    it('formats the calendar date without a time-zone shift', () => {
        expect(formatReleaseDate('2026-10-07', 'en')).toBe('October 7, 2026')
    })

    it('counts items per section kind', () => {
        expect(countItems(releases[0], 'features')).toBe(2)
        expect(countItems(releases[0], 'fixes')).toBe(1)
    })
})
