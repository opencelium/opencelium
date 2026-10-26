import { readdir, readFile } from 'node:fs/promises'
import { basename, join } from 'node:path'
import type { Invoker, InvokerSummary } from './invoker.types.ts'
import { parseInvoker } from './parseInvoker.ts'

export type InvokerRepository = {
    list(): Promise<InvokerSummary[]>
    /** Case-insensitive lookup by invoker <name> or by file name without `.xml`. */
    get(name: string): Promise<Invoker | undefined>
}

type InvokerIndex = Map<string, Invoker>

async function loadIndex(dir: string): Promise<InvokerIndex> {
    const files = (await readdir(dir)).filter((file) => file.toLowerCase().endsWith('.xml'))
    const index: InvokerIndex = new Map()
    for (const file of files) {
        try {
            const invoker = parseInvoker(await readFile(join(dir, file), 'utf8'))
            index.set(basename(file, '.xml').toLowerCase(), invoker)
            if (invoker.name) index.set(invoker.name.toLowerCase(), invoker)
        } catch {
            // A malformed invoker must not take the gateway down; it is simply not offered.
        }
    }
    return index
}

/** Reads the directory once, on first use. Restart the gateway to pick up new invokers. */
export function createInvokerRepository(dir: string): InvokerRepository {
    let index: Promise<InvokerIndex> | undefined
    const getIndex = () => (index ??= loadIndex(dir))

    return {
        async list() {
            const unique = new Set((await getIndex()).values())
            return [...unique]
                .map((invoker) => ({
                    name: invoker.name,
                    description: invoker.description,
                    operationCount: invoker.operations.length,
                }))
                .sort((a, b) => a.name.localeCompare(b.name))
        },
        async get(name) {
            return (await getIndex()).get(name.trim().toLowerCase())
        },
    }
}
