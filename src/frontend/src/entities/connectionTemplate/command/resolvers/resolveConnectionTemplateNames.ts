import { debouncePromise } from '@shared/utils/debouncePromise'
import {
    ensureConnectionTemplatesLoaded,
    formatConnectionTemplateSuggestion,
} from '@entities/connectionTemplate/command/connectionTemplateCache'

async function _resolveConnectionTemplateNames(input: string): Promise<string[]> {
    const templates = await ensureConnectionTemplatesLoaded()
    const needle = (input ?? '').toLowerCase()
    return templates
        .filter((t) => t.name.toLowerCase().includes(needle))
        .map((t) => formatConnectionTemplateSuggestion(t))
}

export const resolveConnectionTemplateNames = debouncePromise(_resolveConnectionTemplateNames, 300)
