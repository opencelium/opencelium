// @vitest-environment node
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import en from '@shared/i18n/locales/en/common.json'
import de from '@shared/i18n/locales/de/common.json'
import { WORKFLOW_GUIDE_IDS } from '@features/onboarding/guides/model/workflowGuides'
import { describeEditorCapabilities, EDITOR_CAPABILITIES, EDITOR_CAPABILITY_IDS, type DescribeIn } from './editorCapabilities'

const CATALOG = fileURLToPath(new URL('../../../../../ai-gateway/test/fixtures/guideCatalog.json', import.meta.url))
const locales = { en, de }

const lookup = (bundle: unknown, key: string): string | undefined => {
    const value = key.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown> | undefined)?.[part], bundle)
    return typeof value === 'string' ? value : undefined
}
const translate: DescribeIn = (language, key) => lookup(locales[language], key) ?? `MISSING ${language} ${key}`

/** One option per line, as the fixture has always been written, so a regeneration diffs by capability. */
const formatCatalog = (options: object[]) =>
    `[\n${options.map(option => `    {${Object.entries(option).map(([k, v]) => `${JSON.stringify(k)}: ${JSON.stringify(v)}`).join(', ')}}`).join(',\n')}\n]\n`

describe('editor capabilities', () => {
    it('has an en and a de description for every capability', () => {
        const missing = describeEditorCapabilities(translate).filter(option => option.description.includes('MISSING'))
        expect(missing).toEqual([])
    })

    it('points teaches and withMethod at capabilities that exist', () => {
        const ids = new Set<string>(EDITOR_CAPABILITY_IDS)
        const refs = Object.values(EDITOR_CAPABILITIES).flatMap(entry => [
            'teaches' in entry ? entry.teaches : undefined, 'withMethod' in entry ? entry.withMethod : undefined,
        ]).filter((ref): ref is string => ref !== undefined)
        expect(refs.filter(ref => !ids.has(ref))).toEqual([])
    })

    it('offers every workflow guide', () => {
        expect(EDITOR_CAPABILITY_IDS.filter(id => EDITOR_CAPABILITIES[id].kind === 'guide')).toEqual([...WORKFLOW_GUIDE_IDS])
    })

    // `npm run ai:catalog` rewrites the fixture instead of comparing.
    it('matches the gateway eval fixture', () => {
        const catalog = formatCatalog(describeEditorCapabilities(translate))
        if (process.env.UPDATE_GUIDE_CATALOG) writeFileSync(CATALOG, catalog)
        expect(readFileSync(CATALOG, 'utf8')).toBe(catalog)
    })
})
