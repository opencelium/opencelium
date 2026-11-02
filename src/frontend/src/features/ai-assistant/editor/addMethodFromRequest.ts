import { message } from 'antd'
import { store } from '@app/store/store'
import { i18n } from '@shared/i18n/config/i18n'
import { notifyError } from '@shared/ui/feedback/notifyError'
import { methodLabel, methodsInWorkflowOrder } from '@features/onboarding/guides/model/resolveGuideNode'
import { addMethodStep } from '@features/workflow/command/addMethodStep'
import { workflowCommandBridgeStore } from '@features/workflow/command/workflowCommandBridge'
import { aiApi } from '../api/aiApi'

export type AddMethodOutcome = 'added' | 'cancelled' | 'not-added' | 'failed'

/** Asked before a change the user did not address to the assistant by name. */
export type ConfirmEdit = (summary: { method: string; connector: string }) => Promise<boolean>

/**
 * "Add get all users from CRM before createClient": the gateway reads the connector, the
 * operation and the step, the editor adds the method there. Every way it can fail is told
 * to the user here, so callers only learn whether something was added.
 */
export async function addMethodFromRequest(prompt: string, confirmEdit?: ConfirmEdit): Promise<AddMethodOutcome> {
    const bridge = workflowCommandBridgeStore.getState()
    const t = i18n.getFixedT(i18n.language, 'common')
    if (!bridge.isEditable()) {
        notifyError(t('commandPalette.workflowEdit.notEditable'))
        return 'not-added'
    }
    const connectors = bridge.getConnectors().filter(connector => connector.invoker?.name)
    if (connectors.length === 0) {
        notifyError(t('commandPalette.workflowEdit.noConnectors'))
        return 'not-added'
    }
    const request = {
        prompt,
        connectors: connectors.map(connector => ({ id: String(connector.connectorId), title: connector.title, invoker: connector.invoker.name })),
        steps: methodsInWorkflowOrder(bridge.getNodes(), bridge.getEdges()).map(node => ({ id: node.id, label: methodLabel(node) })),
    }
    let answer
    try {
        answer = await store.dispatch(aiApi.endpoints.readAddMethod.initiate(request)).unwrap()
    } catch {
        notifyError(t('commandPalette.workflowEdit.failed'))
        return 'failed'
    }
    const connector = connectors.find(item => String(item.connectorId) === answer.connectorId)
    if (!connector) {
        notifyError(t('commandPalette.workflowEdit.unknownConnector'))
        return 'not-added'
    }
    if (!answer.operation) {
        notifyError(t('commandPalette.workflowEdit.unknownMethod', { method: answer.spokenMethod, connector: connector.title }))
        return 'not-added'
    }
    if (confirmEdit && !(await confirmEdit({ method: answer.operation, connector: connector.title }))) return 'cancelled'

    const result = addMethodStep({
        connectorId: connector.connectorId,
        operationName: answer.operation,
        anchorNodeId: answer.stepId,
        position: answer.position,
    })
    switch (result.kind) {
        case 'added':
            message.success(t('commandPalette.workflowEdit.added', { method: result.method, connector: result.connector }))
            return 'added'
        case 'not-editable':
            notifyError(t('commandPalette.workflowEdit.notEditable'))
            return 'not-added'
        case 'unknown-connector':
            notifyError(t('commandPalette.workflowEdit.unknownConnector'))
            return 'not-added'
        case 'unknown-operation':
            notifyError(t('commandPalette.workflowEdit.unknownMethod', { method: answer.operation, connector: connector.title }))
            return 'not-added'
        case 'no-place':
            notifyError(t('commandPalette.workflowEdit.noPlace'))
            return 'not-added'
        default: {
            const _exhaustive: never = result
            return _exhaustive
        }
    }
}
