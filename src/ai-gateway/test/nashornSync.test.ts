import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const FRONTEND = '../frontend/src/features/workflow/script-sandbox'
const FILES = ['checkNashornCompatibility.ts', 'hasNashornSyntax.ts']

describe('the Nashorn check', () => {
    it.runIf(existsSync(FRONTEND))('is a verbatim copy of the editor\'s, so both sides flag the same scripts', () => {
        for (const file of FILES) {
            expect(readFileSync(`src/nashorn/${file}`, 'utf8'), file).toBe(readFileSync(`${FRONTEND}/${file}`, 'utf8'))
        }
    })
})
