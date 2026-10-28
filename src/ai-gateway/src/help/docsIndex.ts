import { readdir, readFile, stat } from 'node:fs/promises'
import { join, relative } from 'node:path'
import { cosine } from '../examples/cosine.ts'
import type { Embedder } from '../llm/ollamaEmbedder.ts'
import { type DocsSection, parseDocsPage } from './docsSections.ts'

export type FoundSection = DocsSection & { score: number }

export type DocsIndex = {
    /** The sections closest to the question, best first; empty when the docs or the embedding model are missing. */
    find(question: string, limit: number): Promise<FoundSection[]>
    warmUp(): Promise<void>
}

const EMBED_BATCH = 64
// The embedding model reads about 2k tokens; the start of a long section carries what it is about.
const EMBEDDED_CHARS = 1500
// Exact words still matter: "LDAP" or "cron" pick the right page even when the wording differs.
const WORD_WEIGHT = 0.05
const SKIPPED_DIRS = new Set(['_static', '_tools', '_build', 'img', 'files'])

async function rstFiles(dir: string, root = dir): Promise<string[]> {
    const entries = await readdir(dir, { withFileTypes: true })
    const nested = await Promise.all(entries.map(async (entry) => {
        if (entry.isDirectory()) return SKIPPED_DIRS.has(entry.name) ? [] : rstFiles(join(dir, entry.name), root)
        return entry.name.endsWith('.rst') ? [relative(root, join(dir, entry.name))] : []
    }))
    return nested.flat()
}

/** Every file's last change, to rebuild the index after the docs were edited. */
async function signature(dir: string, files: string[]): Promise<string> {
    const times = await Promise.all(files.map(async (file) => (await stat(join(dir, file))).mtimeMs))
    return `${files.length}:${Math.max(0, ...times)}`
}

const wordsOf = (text: string) => new Set(text.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((word) => word.length > 2))

export async function loadDocsSections(dir: string): Promise<DocsSection[]> {
    const files = await rstFiles(dir)
    const pages = await Promise.all(files.map(async (file) => parseDocsPage(file.replace(/\.rst$/, ''), await readFile(join(dir, file), 'utf8'))))
    return pages.flat()
}

type Entry = { section: DocsSection; vector: number[]; words: Set<string> }

export function createDocsIndex(dir: string, embedder: Embedder): DocsIndex {
    let built: { signature: string; entries: Promise<Entry[]> } | undefined
    const build = async (): Promise<Entry[]> => {
        const sections = await loadDocsSections(dir)
        const entries: Entry[] = []
        for (let start = 0; start < sections.length; start += EMBED_BATCH) {
            const batch = sections.slice(start, start + EMBED_BATCH)
            const vectors = await embedder.embed(batch.map((section) => `${section.titles.join(' › ')}\n${section.text.slice(0, EMBEDDED_CHARS)}`))
            batch.forEach((section, position) => entries.push({ section, vector: vectors[position] ?? [],
                words: wordsOf(`${section.titles.join(' ')} ${section.text}`) }))
        }
        return entries
    }
    const entries = async () => {
        const current = await signature(dir, await rstFiles(dir))
        if (built?.signature !== current) built = { signature: current, entries: build() }
        try {
            return await built.entries
        } catch (error) {
            built = undefined
            throw error
        }
    }
    return {
        async find(question, limit) {
            try {
                const all = await entries()
                if (all.length === 0) return []
                const [vector = []] = await embedder.embed([question])
                const asked = wordsOf(question)
                return all
                    .map(({ section, vector: own, words }) => {
                        const shared = [...asked].filter((word) => words.has(word)).length
                        return { ...section, score: cosine(vector, own) + WORD_WEIGHT * Math.min(shared, 4) }
                    })
                    .sort((left, right) => right.score - left.score)
                    .slice(0, limit)
            } catch {
                return []
            }
        },
        async warmUp() {
            await entries().catch(() => undefined)
        },
    }
}

export const noDocsIndex: DocsIndex = { find: async () => [], warmUp: async () => undefined }
