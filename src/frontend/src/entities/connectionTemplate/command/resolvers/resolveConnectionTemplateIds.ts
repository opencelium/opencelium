import { debouncePromise } from '@shared/utils/debouncePromise'
import { ensureConnectionTemplatesLoaded } from '@entities/connectionTemplate/command/connectionTemplateCache'

async function _resolveConnectionTemplateIds(input: string): Promise<string[]> {
    const templates = await ensureConnectionTemplatesLoaded()
    const needle = (input ?? '').toLowerCase()
    return templates
        .map((t) => String(t.templateId ?? t.id))
        .filter((id) => id.toLowerCase().includes(needle))
}

export const resolveConnectionTemplateIds = debouncePromise(_resolveConnectionTemplateIds, 300)
