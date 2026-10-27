import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { Invoker } from '../invokers/invoker.types.ts'
import type { InvokerRepository } from '../invokers/invokerRepository.ts'
import type { Embedder } from '../llm/ollamaEmbedder.ts'
import { cosine } from './cosine.ts'
import { type OperationUsage, parseOperationUsages } from './operationUsage.ts'

/** An operation a workflow calls, on the system that owns it, with the other system and the words the plan uses for it. */
export type OperationCall = { invoker: Invoker; operation: string; counterpart: Invoker | null; text: string }

export type OperationExamples = { operation: string; system: string; usages: OperationUsage[] }

export type OperationUsages = {
    /** Template calls of each operation, best first; operations no template calls are left out. */
    find(calls: OperationCall[], perOperation: number): Promise<OperationExamples[]>
    warmUp(): Promise<void>
}

type Entry = { usage: OperationUsage; counterpart?: string; text: string; words: Set<string>; detail: number; vector?: number[] }

const MAX_OPERATIONS = 10
const EMBED_BATCH = 128
// Meaning decides ("using the host name" finds the filter by title); the same other system and exact words
// ("IP" → C__CATG__IP) only tip the balance between calls that mean much the same.
const COUNTERPART_WEIGHT = 0.1
const WORD_WEIGHT = 0.02
const DETAIL_WEIGHT = 0.005
const MAX_CONTEXT = 3
// Short words matter here ("IP" picks the C__CATG__IP call); filler words would match every usage.
const FILLER = new Set(['the', 'of', 'to', 'in', 'on', 'it', 'is', 'an', 'and', 'or', 'for', 'with', 'from', 'by', 'as', 'at', 'item', 'each', 'result'])

const keyOf = (invoker: string, operation: string) => `${invoker.toLowerCase()}\n${operation}`
const wordsOf = (text: string) => new Set(text.toLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length > 1 && !FILLER.has(word)))

/** The usage without its template name: two templates calling an operation the same way show it once. */
const signature = ({ context, endpoint, fields }: OperationUsage) => JSON.stringify([context, endpoint, fields])

/**
 * Calls are filed under the installed invoker their template names, and only when that invoker still has the
 * operation: a call of a renamed or removed operation would teach the model something it cannot use.
 */
async function loadIndex(dir: string, invokers: InvokerRepository, embedder?: Embedder): Promise<Map<string, Entry[]>> {
    const index = new Map<string, Entry[]>()
    let files: string[]
    try {
        files = (await readdir(dir)).filter((file) => file.endsWith('.json'))
    } catch {
        return index
    }
    for (const file of files) {
        let usages: OperationUsage[]
        try {
            usages = parseOperationUsages(JSON.parse(await readFile(join(dir, file), 'utf8')))
        } catch {
            continue
        }
        for (const usage of usages) {
            const invoker = usage.system ? await invokers.get(usage.system) : undefined
            if (!invoker?.operations.some((operation) => operation.name === usage.operation)) continue
            const counterpart = usage.counterpart ? (await invokers.get(usage.counterpart))?.name : undefined
            const text = [...usage.context, usage.endpoint, ...usage.fields].filter(Boolean).join('; ')
            const detail = usage.context.length + usage.fields.length + (usage.endpoint ? 1 : 0)
            const key = keyOf(invoker.name, usage.operation)
            index.set(key, [...(index.get(key) ?? []), { usage, counterpart, text, words: wordsOf(text), detail }])
        }
    }
    if (embedder) await embedEntries([...index.values()].flat(), embedder)
    return index
}

/** Without vectors (no embedding model), calls are ranked by shared words alone. */
async function embedEntries(entries: Entry[], embedder: Embedder): Promise<void> {
    try {
        for (let start = 0; start < entries.length; start += EMBED_BATCH) {
            const batch = entries.slice(start, start + EMBED_BATCH)
            const vectors = await embedder.embed(batch.map((entry) => entry.text))
            batch.forEach((entry, position) => { entry.vector = vectors[position] })
        }
    } catch {
        entries.forEach((entry) => { entry.vector = undefined })
    }
}

/**
 * Ranks a call's usages by how close they are in meaning to the plan step, then by the same other system (the same
 * integration), words shared with the step, and how much a usage shows. The operation name itself is an exact key.
 */
function rank(entries: Entry[], call: OperationCall, vector: number[] | undefined, limit: number): OperationUsage[] {
    const wanted = wordsOf(call.text)
    const scored = entries.map((entry) => {
        const shared = [...wanted].filter((word) => entry.words.has(word)).length
        const sameCounterpart = call.counterpart !== null && entry.counterpart === call.counterpart.name
        const similarity = vector && entry.vector ? cosine(vector, entry.vector) : 0
        const score = similarity + (sameCounterpart ? COUNTERPART_WEIGHT : 0) + WORD_WEIGHT * shared
            + DETAIL_WEIGHT * Math.min(entry.detail, 10)
        return { entry, score }
    })
    const ordered = scored.filter(({ entry }) => entry.detail > 0).sort((left, right) => right.score - left.score)
        .map(({ entry }) => entry.usage)
    // Different templates first: a second call from the same template rarely shows anything new.
    const picked: OperationUsage[] = []
    const seen = new Set<string>()
    for (const isRepeatAllowed of [false, true]) {
        for (const usage of ordered) {
            if (picked.length === limit) return picked
            const isRepeat = picked.some((other) => other.template === usage.template)
            if (seen.has(signature(usage)) || (isRepeat && !isRepeatAllowed)) continue
            seen.add(signature(usage))
            picked.push(usage)
        }
    }
    return picked
}

export function createOperationUsages(dir: string, invokers: InvokerRepository, embedder?: Embedder): OperationUsages {
    let index: Promise<Map<string, Entry[]>> | undefined
    const entries = async () => {
        try {
            return await (index ??= loadIndex(dir, invokers, embedder))
        } catch (error) {
            index = undefined
            throw error
        }
    }
    return {
        async find(calls, perOperation) {
            try {
                const all = await entries()
                const byKey = new Map<string, OperationCall[]>()
                for (const call of calls) {
                    const key = keyOf(call.invoker.name, call.operation)
                    byKey.set(key, [...(byKey.get(key) ?? []), call])
                }
                const groups = [...byKey.values()].slice(0, MAX_OPERATIONS)
                    .flatMap((group) => (group[0] ? [{ ...group[0], text: group.map((call) => call.text).join(' ') }] : []))
                const isEmbedded = [...all.values()].some((list) => list.some((entry) => entry.vector))
                const vectors = embedder && isEmbedded ? await embedder.embed(groups.map((call) => call.text)).catch(() => []) : []
                return groups.flatMap((call, position): OperationExamples[] => {
                    const usages = rank(all.get(keyOf(call.invoker.name, call.operation)) ?? [], call, vectors[position], perOperation)
                    return usages.length ? [{ operation: call.operation, system: call.invoker.name, usages }] : []
                })
            } catch {
                return []
            }
        },
        async warmUp() {
            await entries().catch(() => undefined)
        },
    }
}

export const noOperationUsages: OperationUsages = { find: async () => [], warmUp: async () => undefined }

function describeUsage(usage: OperationUsage): string {
    const systems = [usage.system, usage.counterpart].filter(Boolean).join(' <-> ')
    const context = usage.context.length > MAX_CONTEXT ? ['...', ...usage.context.slice(-MAX_CONTEXT)] : usage.context
    const lines = [`  - in template "${usage.template}" (${systems})${context.length ? `, inside: ${context.join(' > ')}` : ''}`]
    if (usage.endpoint) lines.push(`      endpoint: ${usage.endpoint}`)
    if (usage.fields.length) lines.push(`      fields: ${usage.fields.join('; ')}`)
    return lines.join('\n')
}

/** Per operation, how templates call it: a pattern to adapt, since its paths come from another workflow. */
export function describeOperationExamples(examples: OperationExamples[]): string {
    if (examples.length === 0) return ''
    const sections = examples.map((example) => `${example.operation} (${example.system}):\n${example.usages.map(describeUsage).join('\n')}`)
    return `How these operations are called in this installation's templates. Take over what fits this workflow (params,
fixed values such as filters, states or categories, where field values come from); the request and the plan win where
they differ, and references must point to this workflow's own steps. Set each field by its full dot path, as shown;
never write an object as one text literal.
${sections.join('\n')}

`
}
