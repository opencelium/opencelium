// Turns the repo-root CHANGELOG.rst into the release list rendered by the changelog page.
//
// Shape it expects, per release:
//
//   5.2                      <- version, underlined with '='
//   ========
//   :Date: October 7, 2026   <- English or German month name
//   Features                 <- section, underlined with '-'
//   --------
//   * item (OC-123)
//
// A '='-underlined title that is not a version (e.g. "Major Release :loudspeaker:")
// marks the release right below it as major.

const MONTHS = {
    january: 1, januar: 1,
    february: 2, februar: 2,
    march: 3, märz: 3, maerz: 3,
    april: 4,
    may: 5, mai: 5,
    june: 6, juni: 6,
    july: 7, juli: 7,
    august: 8,
    september: 9,
    october: 10, oktober: 10,
    november: 11,
    december: 12, dezember: 12,
}

const SECTION_KINDS = {
    features: 'features',
    fixes: 'fixes',
    hotfix: 'fixes',
}

const VERSION = /^\d+(\.\d+)*$/

function compareVersions(a, b) {
    const left = a.split('.').map(Number)
    const right = b.split('.').map(Number)
    for (let i = 0; i < Math.max(left.length, right.length); i++) {
        const diff = (left[i] ?? 0) - (right[i] ?? 0)
        if (diff !== 0) return diff
    }
    return 0
}

function parseDate(text, lineNumber) {
    const match = /^([^\s\d]+)\s+(\d{1,2}),\s*(\d{4})$/.exec(text.trim())
    const month = match && MONTHS[match[1].toLowerCase()]
    if (!match || !month) throw new Error(`CHANGELOG.rst:${lineNumber}: cannot read date "${text.trim()}"`)
    const pad = (value) => String(value).padStart(2, '0')
    return `${match[3]}-${pad(month)}-${pad(match[2])}`
}

/**
 * @param {string} text CHANGELOG.rst contents
 * @param {{ oldestVersion?: string }} [options] releases older than this are left out
 */
function parseChangelogRst(text, options = {}) {
    const lines = text.replace(/\r\n?/g, '\n').split('\n')
    const releases = []
    let release = null
    let section = null
    let isNextMajor = false

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trimEnd()
        const next = (lines[i + 1] ?? '').trim()
        const lineNumber = i + 1

        if (line && /^=+$/.test(next)) {
            i++
            if (!VERSION.test(line.trim())) {
                if (/major/i.test(line)) isNextMajor = true
                continue
            }
            const version = line.trim()
            if (options.oldestVersion && compareVersions(version, options.oldestVersion) < 0) break
            release = { version, date: null, isMajor: isNextMajor, sections: [] }
            releases.push(release)
            section = null
            isNextMajor = false
            continue
        }
        if (!release) continue

        if (line && /^-+$/.test(next)) {
            i++
            const kind = SECTION_KINDS[line.trim().toLowerCase()]
            if (!kind) throw new Error(`CHANGELOG.rst:${lineNumber}: unknown section "${line.trim()}" in ${release.version}`)
            section = release.sections.find((item) => item.kind === kind)
            if (!section) {
                section = { kind, items: [] }
                release.sections.push(section)
            }
            continue
        }

        const date = /^:Date:\s*(.+)$/i.exec(line.trim())
        if (date) {
            release.date = parseDate(date[1], lineNumber)
            continue
        }

        const item = /^\*\s+(.*)$/.exec(line.trim())
        if (item) {
            if (!section) throw new Error(`CHANGELOG.rst:${lineNumber}: item outside a section in ${release.version}`)
            section.items.push(item[1])
            continue
        }

        if (line.trim()) throw new Error(`CHANGELOG.rst:${lineNumber}: unexpected line "${line.trim()}"`)
    }

    for (const item of releases) {
        if (!item.date) throw new Error(`CHANGELOG.rst: release ${item.version} has no :Date:`)
    }
    return releases.map(({ isMajor, ...rest }) => (isMajor ? { ...rest, isMajor } : rest))
}

const quote = (value) => `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`

/** Renders the releases as the `changelog.data.ts` module. */
function renderChangelogModule(releases) {
    const out = [
        '// Generated from CHANGELOG.rst by scripts/generate-changelog.cjs (`npm run gen-changelog`).',
        '// Do not edit by hand — edit CHANGELOG.rst and regenerate.',
        "import type { ChangelogRelease } from '@features/changelog/model/types'",
        '',
        'export const CHANGELOG: ChangelogRelease[] = [',
    ]
    for (const release of releases) {
        out.push('    {')
        out.push(`        version: ${quote(release.version)},`)
        out.push(`        date: ${quote(release.date)},`)
        if (release.isMajor) out.push('        isMajor: true,')
        out.push('        sections: [')
        for (const section of release.sections) {
            out.push('            {')
            out.push(`                kind: ${quote(section.kind)},`)
            out.push('                items: [')
            for (const item of section.items) out.push(`                    ${quote(item)},`)
            out.push('                ],')
            out.push('            },')
        }
        out.push('        ],')
        out.push('    },')
    }
    out.push(']')
    return `${out.join('\n')}\n`
}

module.exports = { parseChangelogRst, renderChangelogModule }
