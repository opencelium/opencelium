// Regenerates src/features/changelog/model/changelog.data.ts from the repo-root CHANGELOG.rst.
//
//   node scripts/generate-changelog.cjs           write the module
//   node scripts/generate-changelog.cjs --check   exit 1 when the module is out of date
//
// Runs before `dev` and `build`. When CHANGELOG.rst is not reachable (a build
// context holding only src/frontend), the committed module is kept as is.

const fs = require('node:fs')
const path = require('node:path')
const { parseChangelogRst, renderChangelogModule } = require('./changelog/parseChangelogRst.cjs')

const OLDEST_VERSION = '4.0'
const source = path.resolve(__dirname, '../../../CHANGELOG.rst')
const target = path.resolve(__dirname, '../src/features/changelog/model/changelog.data.ts')
const isCheck = process.argv.includes('--check')

if (!fs.existsSync(source)) {
    console.warn(`[changelog] ${source} not found, keeping the committed ${path.basename(target)}`)
    process.exit(0)
}

const releases = parseChangelogRst(fs.readFileSync(source, 'utf-8'), { oldestVersion: OLDEST_VERSION })
const next = renderChangelogModule(releases)
const current = fs.existsSync(target) ? fs.readFileSync(target, 'utf-8') : ''

if (isCheck) {
    if (current !== next) {
        console.error('[changelog] changelog.data.ts is out of date, run `npm run gen-changelog`')
        process.exit(1)
    }
    process.exit(0)
}

if (current !== next) {
    fs.writeFileSync(target, next)
    console.log(`[changelog] wrote ${releases.length} releases to ${path.relative(process.cwd(), target)}`)
}
