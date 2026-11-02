import { store } from '@app/store/store'
import { i18n } from '@shared/i18n/config/i18n'
import { notifyError } from '@shared/ui/feedback/notifyError'
import { requestEditorBridgeStore } from '@features/workflow/command/requestEditorBridge'
import { aiApi } from '../api/aiApi'
import { usePendingScriptStore } from '../hooks/pendingScript.store'

export type TransformationRequestOutcome = 'started' | 'not-started' | 'failed'

/**
 * "Apply transformation for Vendor with convert it to upper case", on the body or headers open in the method dialog
 * — only there: the field is one of theirs. The field's transformation is shown (created for a field that holds a
 * reference) and its script generated from the description. Without a field named, the one selected in the editor. `isApplied`: said to the assistant by name, so the script
 * goes in at once (Undo is in the toast); otherwise it is offered to compare and accept like any generated script.
 */
export async function applyTransformationFromRequest(prompt: string, isApplied: boolean): Promise<TransformationRequestOutcome> {
    const t = i18n.getFixedT(i18n.language, 'common')
    const editor = requestEditorBridgeStore.getState().editor
    if (!editor) {
        notifyError(t('commandPalette.workflowEdit.noOpenEditor'))
        return 'not-started'
    }
    const part = t(`commandPalette.workflowEdit.part.${editor.messageProperty}`)
    const fields = editor.fieldPaths()
    if (fields.length === 0) {
        notifyError(t('commandPalette.workflowEdit.noFields', { part }))
        return 'not-started'
    }
    let answer
    try {
        answer = await store.dispatch(aiApi.endpoints.readTransformation.initiate({ prompt, fields })).unwrap()
    } catch {
        notifyError(t('commandPalette.workflowEdit.transformationFailed'))
        return 'failed'
    }
    // Named but not there: say so. Named none ("this property"): the field selected in the editor, as for methods.
    if (!answer.field && answer.spokenField) {
        notifyError(t('commandPalette.workflowEdit.unknownField', { part, field: answer.spokenField }))
        return 'not-started'
    }
    if (!answer.description) {
        notifyError(t('commandPalette.workflowEdit.noScriptDescription'))
        return 'not-started'
    }
    // The editor may have closed while the gateway answered.
    const current = requestEditorBridgeStore.getState().editor
    if (!current) {
        notifyError(t('commandPalette.workflowEdit.noOpenEditor'))
        return 'not-started'
    }
    const field = answer.field || current.selectedFieldPath()
    if (!field) {
        notifyError(t('commandPalette.workflowEdit.noFieldNamed', { part }))
        return 'not-started'
    }
    const opened = current.openTransformation(field)
    switch (opened.kind) {
        case 'opened':
            usePendingScriptStore.getState().request({ enhanceId: opened.enhanceId, description: answer.description, isApplied })
            return 'started'
        case 'unknown-field':
            notifyError(t('commandPalette.workflowEdit.unknownField', { part, field }))
            return 'not-started'
        case 'no-reference':
            notifyError(t('commandPalette.workflowEdit.noReference', { field }))
            return 'not-started'
        default: {
            const _exhaustive: never = opened
            return _exhaustive
        }
    }
}
