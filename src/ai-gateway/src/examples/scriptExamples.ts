import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { Embedder } from '../llm/ollamaEmbedder.ts'

/** A transformation from a stored template: the field it fills, the fields it reads (VAR_0, VAR_1, …) and its code. */
export type ScriptExample = { target: string; inputs: string[]; code: string }

export type ScriptExamples = {
    /** The most similar stored scripts to a plain-language rule; empty when none is close or the index is unavailable. */
    find(query: string, limit: number): Promise<ScriptExample[]>
}

type RawEndpoint = { field?: unknown }
type RawBinding = { from?: RawEndpoint[]; to?: RawEndpoint[]; enhancement?: { expertCode?: unknown; script?: unknown } }

// A copy of one input teaches nothing; such scripts are most of what templates hold.
const PASS_THROUGH_RE = /^\s*RESULT_VAR\s*=\s*VAR_\d+\s*;?\s*$/
// Below this cosine similarity an "example" is about something else and only distracts the model.
const MIN_SIMILARITY = 0.55
const MAX_CODE_LENGTH = 1500

const fieldOf = (endpoint: RawEndpoint | undefined) =>
    typeof endpoint?.field === 'string' ? endpoint.field.replace(/^body\.\$\./, '') : ''

/** Non-trivial scripts of every template in `dir`; unreadable files are skipped, duplicates kept once. */
export async function loadTemplateScripts(dir: string): Promise<ScriptExample[]> {
    let files: string[]
    try {
        files = (await readdir(dir)).filter((file) => file.endsWith('.json'))
    } catch {
        return []
    }
    const seen = new Set<string>()
    const examples: ScriptExample[] = []
    for (const file of files) {
        let bindings: RawBinding[] = []
        try {
            const json = JSON.parse(await readFile(join(dir, file), 'utf8')) as { connection?: unknown; fieldBinding?: unknown }
            const connection = (json.connection ?? json) as { fieldBinding?: unknown; fieldBindings?: unknown }
            const raw = connection.fieldBinding ?? connection.fieldBindings
            bindings = Array.isArray(raw) ? raw as RawBinding[] : []
        } catch {
            continue
        }
        for (const binding of bindings) {
            const code = binding.enhancement?.expertCode ?? binding.enhancement?.script
            if (typeof code !== 'string' || !code.trim() || PASS_THROUGH_RE.test(code) || code.length > MAX_CODE_LENGTH) continue
            if (seen.has(code.trim())) continue
            seen.add(code.trim())
            examples.push({ target: fieldOf(binding.to?.[0]), inputs: (binding.from ?? []).map(fieldOf), code: code.trim() })
        }
    }
    return examples
}

const describe = (example: ScriptExample) =>
    `Field ${example.target} computed from ${example.inputs.join(', ')}:\n${example.code}`

function cosine(left: number[], right: number[]): number {
    let dot = 0, leftNorm = 0, rightNorm = 0
    left.forEach((value, index) => {
        const other = right[index] ?? 0
        dot += value * other
        leftNorm += value * value
        rightNorm += other * other
    })
    return leftNorm && rightNorm ? dot / Math.sqrt(leftNorm * rightNorm) : 0
}

/**
 * Embeds the template scripts on first use and keeps them in memory: a handful of scripts needs no vector store.
 * Any failure (no embedding model, no templates) degrades to "no examples", never to a failed request.
 */
export function createScriptExamples(dir: string, embedder: Embedder): ScriptExamples {
    let index: Promise<{ example: ScriptExample; vector: number[] }[]> | undefined
    const load = async () => {
        const examples = await loadTemplateScripts(dir)
        if (examples.length === 0) return []
        const vectors = await embedder.embed(examples.map(describe))
        return examples.map((example, position) => ({ example, vector: vectors[position] ?? [] }))
    }
    return {
        async find(query, limit) {
            try {
                index ??= load()
                const entries = await index
                if (entries.length === 0) return []
                const [vector = []] = await embedder.embed([query])
                return entries
                    .map((entry) => ({ entry, score: cosine(vector, entry.vector) }))
                    .filter(({ score }) => score >= MIN_SIMILARITY)
                    .sort((left, right) => right.score - left.score)
                    .slice(0, limit)
                    .map(({ entry }) => entry.example)
            } catch {
                index = undefined
                return []
            }
        },
    }
}

export const noScriptExamples: ScriptExamples = { find: async () => [] }

/** Examples as prose plus code: a header written as a code comment gets copied, wrong paths and all, into new scripts. */
export function formatScriptExamples(examples: ScriptExample[]): string {
    return examples.map((example) => `  Example for ${example.target}, with ${example.inputs.map((input, n) => `VAR_${n} = ${input}`).join(', ')}:\n`
        + example.code.split('\n').map((line) => `    ${line}`).join('\n')).join('\n\n')
}
