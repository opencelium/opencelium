import { store } from '@app/store/store'
import { i18n } from '@shared/i18n/config/i18n'
import { methodLabel, methodsInWorkflowOrder } from '@features/onboarding/guides/model/resolveGuideNode'
import { addOperatorStep } from '@features/workflow/command/addOperatorStep'
import { workflowCommandBridgeStore } from '@features/workflow/command/workflowCommandBridge'
import { aiApi } from '../api/aiApi'
import { usePendingConditionStore } from '../condition/pendingCondition.store'
import { tell } from './tell'

export type AddOperatorOutcome = 'added' | 'not-added' | 'failed'

/**
 * "Add an if after ConfigItemSearch when nothing was found" / "loop over the issues of SearchIssues": the gateway reads
 * the kind, the step and the condition in words; the editor adds the operator there and opens its condition dialog. An
 * if's condition, or the list a loop repeats over, is then built there by the AI from those words, to check and save. Adding is undone
 * like any edit and changes nothing that runs until the condition is saved, so no confirmation is asked.
 */
export async function addOperatorFromRequest(prompt: string): Promise<AddOperatorOutcome> {
    const bridge = workflowCommandBridgeStore.getState()
    const t = i18n.getFixedT(i18n.language, 'common')
    if (!bridge.isEditable()) {
        tell.error(t('commandPalette.workflowEdit.notEditable'))
        return 'not-added'
    }
    const steps = methodsInWorkflowOrder(bridge.getNodes(), bridge.getEdges()).map(node => ({ id: node.id, label: methodLabel(node) }))
    let answer
    try {
        answer = await store.dispatch(aiApi.endpoints.readAddOperator.initiate({ prompt, steps })).unwrap()
    } catch {
        tell.error(t('commandPalette.workflowAssist.operatorFailed'))
        return 'failed'
    }
    const result = addOperatorStep({ kind: answer.kind, anchorNodeId: answer.stepId, position: answer.position })
    if (result.kind === 'not-editable') {
        tell.error(t('commandPalette.workflowEdit.notEditable'))
        return 'not-added'
    }
    if (result.kind === 'no-place') {
        tell.error(t('commandPalette.workflowEdit.noPlace'))
        return 'not-added'
    }
    // An if's condition, or what a loop repeats over, built in the dialog from the user's words.
    const hasCondition = answer.condition !== ''
    if (hasCondition) usePendingConditionStore.getState().request(result.nodeId, answer.condition)
    bridge.openConditionEditor(result.nodeId)
    tell.success(answer.kind === 'loop' ? t('commandPalette.workflowAssist.loopAdded')
        : hasCondition ? t('commandPalette.workflowAssist.ifAdded', { condition: answer.condition })
        : t('commandPalette.workflowAssist.ifAddedEmpty'))
    return 'added'
}
