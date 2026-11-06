import { store } from '@app/store/store'
import { i18n } from '@shared/i18n/config/i18n'
import { guideMethodNames, resolveGuideNode } from '@features/onboarding/guides/model/resolveGuideNode'
import { workflowCommandBridgeStore } from '@features/workflow/command/workflowCommandBridge'
import { aiApi } from '../api/aiApi'
import { usePendingMappingStore } from '../mapping/pendingMapping.store'
import { tell } from './tell'

export type MappingRequestOutcome = 'opened' | 'not-opened' | 'failed'

/**
 * "Suggest references for ConfigItemUpdate from ConfigItemGet": the gateway reads which method gets
 * the references and which one supplies them, the editor opens the target's body and runs the
 * AI mapping there with only the source's values. Nothing changes until the user applies the
 * suggestions, so no confirmation is asked. Methods resolve like the guides: a named one is the
 * first match in the tree; an unnamed target is the selected method, else the first.
 */
export async function suggestMappingFromRequest(prompt: string): Promise<MappingRequestOutcome> {
    const bridge = workflowCommandBridgeStore.getState()
    const t = i18n.getFixedT(i18n.language, 'common')
    const tGuides = i18n.getFixedT(i18n.language, 'onboarding')
    if (!bridge.isEditable()) {
        tell.error(t('commandPalette.workflowEdit.notEditable'))
        return 'not-opened'
    }
    const methods = guideMethodNames(bridge.getNodes())
    if (methods.length === 0) {
        tell.error(tGuides('guides.errors.noMethods'))
        return 'not-opened'
    }
    let answer
    try {
        answer = await store.dispatch(aiApi.endpoints.readMapping.initiate({ prompt, methods })).unwrap()
    } catch {
        tell.error(t('commandPalette.workflowEdit.mappingFailed'))
        return 'failed'
    }

    const [nodes, edges] = [bridge.getNodes(), bridge.getEdges()]
    const target = resolveGuideNode(nodes, edges, answer.target || undefined)
    const source = answer.source ? resolveGuideNode(nodes, edges, answer.source) : null
    for (const resolution of [target, source]) {
        if (resolution?.kind === 'no-methods') tell.error(tGuides('guides.errors.noMethods'))
        if (resolution?.kind === 'no-match') tell.error(t('commandPalette.workflowEdit.unknownStep', { method: resolution.method }))
    }
    if (target.kind !== 'found' || (source && source.kind !== 'found')) return 'not-opened'
    if (source?.nodeId === target.nodeId) {
        tell.error(t('commandPalette.workflowEdit.sameMethod'))
        return 'not-opened'
    }

    usePendingMappingStore.getState().request({
        methodId: target.nodeId,
        source: source ? { methodId: source.nodeId, label: source.label } : null,
    })
    bridge.centerOnNode(target.nodeId)
    bridge.openRequestEditor({ nodeId: target.nodeId, mode: 'body' })
    return 'opened'
}
