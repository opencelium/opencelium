import {store} from '@app/store/store'
import {systemConfigApi} from '@entities/systemConfig/api/systemConfigApi'
import {useMasterPasswordStore} from '@features/master-password'
import type {ConfigNode} from '@entities/systemConfig/model/types'
import {isContainerNode} from '@entities/systemConfig/model/types'
import {buildNodeByPathMap, searchConfigByLabel} from '@entities/systemConfig/model/helpers'
import {debouncePromise} from '@shared/utils/debouncePromise'
import {i18n} from '@shared/i18n/config/i18n'

const SUGGESTION_LIMIT = 20

/** Single suggestion shown while the config is still locked. */
export function provideMasterPasswordLabel(): string {
    return i18n.getFixedT(i18n.language, 'entities')('system-config.commandPalette.provideMasterPassword')
}

export async function loadConfigFields(): Promise<ConfigNode[]> {
    const result = await store.dispatch(
        systemConfigApi.endpoints.getApplicationConfig.initiate(undefined, {subscribe: false}),
    )
    return 'data' in result && result.data ? result.data.fields : []
}

async function _resolveSystemConfig(input: string): Promise<string[]> {
    if (!useMasterPasswordStore.getState().masterPassword) {
        return [provideMasterPasswordLabel()]
    }

    const fields = await loadConfigFields()
    const query = (input ?? '').trim()

    // No query yet — surface the first level so the user can browse or drill.
    if (!query) return fields.slice(0, SUGGESTION_LIMIT).map((n) => n.path)

    // Exact container path — list its direct children (the drill-in step).
    const node = buildNodeByPathMap(fields).get(query)
    if (node && isContainerNode(node)) {
        return (node.value as ConfigNode[]).slice(0, SUGGESTION_LIMIT).map((n) => n.path)
    }

    return searchConfigByLabel(fields, query, SUGGESTION_LIMIT).map((n) => n.path)
}

export const resolveSystemConfig = debouncePromise(_resolveSystemConfig, 300)
