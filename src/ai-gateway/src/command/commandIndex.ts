import type { Embedder } from '../llm/ollamaEmbedder.ts'
import type { CatalogCommand } from './commandRequest.schema.ts'

export type RankedCommand = { id: string; score: number }

export type CommandIndex = {
    /** Commands closest in meaning to the query, best first; never fails (falls back to shared words). */
    rank(query: string, commands: CatalogCommand[], limit: number, options?: { isThresholded?: boolean }): Promise<RankedCommand[]>
}

// Below this a match is about something else; tuned on nomic-embed-text, where unrelated commands sit around 0.4.
const MIN_SCORE = 0.5
const MAX_CACHED = 5000
// Suggestions far below the best one are noise next to it ("delete user" when asked to show users).
const MAX_GAP_TO_BEST = 0.08

/** What gets embedded: the typed words without the value placeholder, then what the command does. */
export const commandText = (command: CatalogCommand) =>
    `${command.phrase.replace(/<[^>]*>/g, '').replace(/[._-]+/g, ' ').replace(/\s+/g, ' ').trim()}: ${command.description}`

const STOP_WORDS = new Set([
    'the', 'and', 'for', 'with', 'from', 'into', 'all', 'this', 'that', 'please', 'show', 'open',
    'der', 'die', 'das', 'und', 'mit', 'von', 'für', 'alle', 'bitte', 'zeige', 'öffne',
])
const words = (text: string) =>
    new Set(text.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((word) => word.length > 2 && !STOP_WORDS.has(word)))
// "schedule" matches "schedules", but "the" must not match "theme".
const isSameWord = (left: string, right: string) =>
    left === right || (Math.min(left.length, right.length) >= 4 && (left.startsWith(right) || right.startsWith(left)))

/** Share of the query's words found in the command, for when no embedding model is available. */
function overlap(query: string, text: string): number {
    const queryWords = words(query)
    if (queryWords.size === 0) return 0
    const textWords = words(text)
    let shared = 0
    queryWords.forEach((word) => {
        if ([...textWords].some((candidate) => isSameWord(word, candidate))) shared++
    })
    return shared / queryWords.size
}

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
 * Ranks palette commands by meaning. Command vectors are cached by text: the catalog barely changes between calls, so a
 * search costs one embedding (the query).
 */
export function createCommandIndex(embedder: Embedder | undefined): CommandIndex {
    const cache = new Map<string, number[]>()

    const vectorsFor = async (texts: string[]): Promise<number[][]> => {
        const missing = [...new Set(texts.filter((text) => !cache.has(text)))]
        if (missing.length) {
            const vectors = await embedder!.embed(missing)
            if (cache.size + missing.length > MAX_CACHED) cache.clear()
            missing.forEach((text, position) => cache.set(text, vectors[position] ?? []))
        }
        return texts.map((text) => cache.get(text) ?? [])
    }

    const byWords = (query: string, commands: CatalogCommand[]) =>
        commands.map((command) => ({ id: command.id, score: overlap(query, commandText(command)) }))

    return {
        async rank(query, commands, limit, { isThresholded = true } = {}) {
            let scored: RankedCommand[]
            try {
                if (!embedder) throw new Error('no embedder')
                const texts = commands.map(commandText)
                const [queryVector = [], ...vectors] = await vectorsFor([query, ...texts])
                // Shared words decide between commands that mean nearly the same ("delete user" vs "delete role").
                scored = commands.map((command, position) => ({
                    id: command.id,
                    score: cosine(queryVector, vectors[position] ?? []) + 0.1 * overlap(query, texts[position] ?? ''),
                }))
            } catch {
                scored = byWords(query, commands).map((entry) => ({ ...entry, score: entry.score > 0 ? MIN_SCORE + entry.score / 2 : 0 }))
            }
            const sorted = scored.sort((left, right) => right.score - left.score)
            if (!isThresholded) return sorted.slice(0, limit)
            const best = sorted[0]?.score ?? 0
            return sorted.filter((entry) => entry.score >= MIN_SCORE && entry.score >= best - MAX_GAP_TO_BEST).slice(0, limit)
        },
    }
}
