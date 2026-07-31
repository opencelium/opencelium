import { debouncePromise } from '@shared/utils/debouncePromise'
import type { SuggestionOption } from '@shared/command/types'
import {
    ensureConnectionTemplatesLoaded,
    formatConnectionTemplateSuggestion,
} from '@entities/connectionTemplate/command/connectionTemplateCache'

async function _resolveConnectionTemplateNames(input: string): Promise<SuggestionOption[]> {
    const templates = await ensureConnectionTemplatesLoaded()
    const needle = (input ?? '').toLowerCase()
    return templates
        .filter((t) => t.name.toLowerCase().includes(needle))
        .map((t) => ({ value: formatConnectionTemplateSuggestion(t), label: t.name }))
}

export const resolveConnectionTemplateNames = debouncePromise(_resolveConnectionTemplateNames, 300)
