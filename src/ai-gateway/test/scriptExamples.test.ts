import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createScriptExamples, formatScriptExamples, loadTemplateScripts } from '../src/examples/scriptExamples.ts'
import type { Embedder } from '../src/llm/ollamaEmbedder.ts'

const binding = (target: string, inputs: string[], code: string) => ({
    from: inputs.map((field) => ({ field: `body.$.${field}` })), to: [{ field: `body.$.${target}` }],
    enhancement: { expertCode: code },
})
const mapping = "RESULT_VAR = 'Operational';\nif (VAR_0 != 'in operation') { RESULT_VAR = 'Incident'; }"

function templateDir(): string {
    const dir = mkdtempSync(join(tmpdir(), 'ai-templates-'))
    writeFileSync(join(dir, 'a.json'), JSON.stringify({ connection: { fieldBinding: [
        binding('ConfigItem.InciState', ['result[i].cmdb_status_title'], mapping),
        binding('ConfigItem.Name', ['result[i].title'], 'RESULT_VAR = VAR_0;'),
    ] } }))
    writeFileSync(join(dir, 'b.json'), JSON.stringify({ fieldBinding: [binding('Other.InciState', ['x'], mapping)] }))
    writeFileSync(join(dir, 'broken.json'), '{ not json')
    return dir
}

/** Vectors by keyword, so similarity is predictable: "state" and "id" texts point in different directions. */
const embedder: Embedder = {
    async embed(texts) {
        return texts.map((text) => [/state|operational/i.test(text) ? 1 : 0, /\bid\b|ConfigItemID/i.test(text) ? 1 : 0, 0.01])
    },
}

describe('loadTemplateScripts', () => {
    it('keeps non-trivial scripts once, with the field they fill and the fields they read', async () => {
        expect(await loadTemplateScripts(templateDir())).toEqual([
            { target: 'ConfigItem.InciState', inputs: ['result[i].cmdb_status_title'], code: mapping },
        ])
    })

    it('returns nothing for a missing directory', async () => {
        expect(await loadTemplateScripts('/does/not/exist')).toEqual([])
    })
})

describe('createScriptExamples', () => {
    it('finds similar scripts and leaves out unrelated ones', async () => {
        const examples = createScriptExamples(templateDir(), embedder)
        expect(await examples.find('InciState = script: "Operational" when in operation', 2)).toHaveLength(1)
        expect(await examples.find('ConfigItemID = script: the id of the matching item', 2)).toEqual([])
    })

    it('degrades to no examples when embedding fails', async () => {
        const failing: Embedder = { embed: () => Promise.reject(new Error('no model')) }
        expect(await createScriptExamples(templateDir(), failing).find('anything', 2)).toEqual([])
    })

    it('formats examples with their VAR_n inputs', () => {
        expect(formatScriptExamples([{ target: 'A', inputs: ['x', 'y'], code: 'RESULT_VAR = VAR_0 + VAR_1;' }]))
            .toBe('  // A from VAR_0=x, VAR_1=y\n  RESULT_VAR = VAR_0 + VAR_1;')
    })
})
