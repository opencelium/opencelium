import { debouncePromise } from '@shared/utils/debouncePromise'
import { ensureConnectorMetaLoaded } from '@entities/connector/command/connectorCache'

const SUGGESTION_LIMIT = 20

async function _resolveConnectorTitles(input: string): Promise<string[]> {
    const list = await ensureConnectorMetaLoaded()
    const needle = (input ?? '').toLowerCase()
    const matches = needle
        ? list.filter((c) => c.title.toLowerCase().includes(needle))
        : list
    return matches.slice(0, SUGGESTION_LIMIT).map((c) => c.title)
}

export const resolveConnectorTitles = debouncePromise(_resolveConnectorTitles, 300)
