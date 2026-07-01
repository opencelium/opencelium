import { debouncePromise } from '@shared/utils/debouncePromise'
import { ensureConnectionTemplatesLoaded } from '@entities/connectionTemplate/command/connectionTemplateCache'

async function _resolveConnectionTemplateNames(input: string): Promise<string[]> {
    const templates = await ensureConnectionTemplatesLoaded()
    const needle = (input ?? '').toLowerCase()
    return templates
        .map((t) => t.name)
        .filter((name) => name.toLowerCase().includes(needle))
}

export const resolveConnectionTemplateNames = debouncePromise(_resolveConnectionTemplateNames, 300)
