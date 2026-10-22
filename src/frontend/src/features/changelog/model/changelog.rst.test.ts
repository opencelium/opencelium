import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parseChangelogRst, renderChangelogModule } from '../../../../scripts/changelog/parseChangelogRst.cjs'

const RST_PATH = '../../CHANGELOG.rst'
const DATA_PATH = 'src/features/changelog/model/changelog.data.ts'

const rst = (body: string) => `*********\nChangelog\n*********\n\n${body}`

describe('parseChangelogRst', () => {
    it('reads versions, dates and sections', () => {
        const releases = parseChangelogRst(rst(`5.2
========

:Date: October 7, 2026

Features
--------
* Field Reference Overview

Fixes
--------

* Fix it (OC-1539)
`))
        expect(releases).toEqual([{
            version: '5.2',
            date: '2026-10-07',
            sections: [
                { kind: 'features', items: ['Field Reference Overview'] },
                { kind: 'fixes', items: ['Fix it (OC-1539)'] },
            ],
        }])
    })

    it('marks the release under a "Major Release" title as major', () => {
        const [release] = parseChangelogRst(rst(`Major Relase :loudspeaker:
========

5.0
========

:Date: July 30, 2026

Features
--------
* New Workflow Editor
`))
        expect(release.isMajor).toBe(true)
    })

    it('understands German month names', () => {
        const [release] = parseChangelogRst(rst(`4.7
========

:Date: Dezember 17, 2025

Fixes
--------
* A
`))
        expect(release.date).toBe('2025-12-17')
    })

    it('stops at the oldest version asked for', () => {
        const releases = parseChangelogRst(rst(`4.1
========

:Date: July 11, 2024

Fixes
--------
* A

4.0
========

:Date: June 05, 2024

Fixes
--------
* B
`), { oldestVersion: '4.1' })
        expect(releases.map((release) => release.version)).toEqual(['4.1'])
    })

    it('rejects a section heading it does not know', () => {
        expect(() => parseChangelogRst(rst(`5.3
========

:Date: May 1, 2027

Connector
--------
* A
`))).toThrow(/unknown section "Connector"/)
    })

    it('escapes quotes and backslashes when rendering', () => {
        const module = renderChangelogModule([{ version: '1.0', date: '2020-01-01',
            sections: [{ kind: 'fixes', items: ["doesn't take \\n"] }] }])
        expect(module).toContain("'doesn\\'t take \\\\n',")
    })
})

describe.skipIf(!existsSync(RST_PATH))('changelog.data.ts', () => {
    it('is in sync with CHANGELOG.rst (run `npm run gen-changelog`)', () => {
        const releases = parseChangelogRst(readFileSync(RST_PATH, 'utf-8'), { oldestVersion: '4.0' })
        expect(readFileSync(DATA_PATH, 'utf-8')).toBe(renderChangelogModule(releases))
    })
})
