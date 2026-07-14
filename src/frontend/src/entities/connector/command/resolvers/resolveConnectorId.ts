import { debouncePromise } from '@shared/utils/debouncePromise'
import { ensureConnectorMetaLoaded } from '@entities/connector/command/connectorCache'

const SUGGESTION_LIMIT = 20

async function _resolveConnectorIds(input: string): Promise<string[]> {
    const list = await ensureConnectorMetaLoaded()
    const needle = (input ?? '').trim()
    const matches = needle
        ? list.filter((c) => String(c.connectorId).includes(needle))
        : list
    return matches.slice(0, SUGGESTION_LIMIT).map((c) => String(c.connectorId))
}

export const resolveConnectorIds = debouncePromise(_resolveConnectorIds, 300)
