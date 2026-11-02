import { i18n } from '@shared/i18n/config/i18n'
import { notifyError } from '@shared/ui/feedback/notifyError'
import { workflowCommandBridgeStore } from '@features/workflow/command/workflowCommandBridge'
import { useWorkflowTutorialStore } from '../../workflow-tutorial/model/workflowTutorial.store'
import { resolveGuideNode } from './resolveGuideNode'
import { useWorkflowGuideStore } from './workflowGuide.store'
import type { WorkflowGuideId } from './workflowGuides'

/**
 * Starts a guide on the workflow open in the editor. Outside React on purpose: the
 * command palette (and later the voice assistant) call it from plain executors.
 */
export function startWorkflowGuide(guideId: WorkflowGuideId, method?: string): void {
    const bridge = workflowCommandBridgeStore.getState()
    // The tutorial owns the editor while it runs; two spotlights would fight over the page.
    if (!bridge.isActive || useWorkflowTutorialStore.getState().requested) return

    const t = i18n.getFixedT(i18n.language, 'onboarding')
    const resolution = resolveGuideNode(bridge.getNodes(), bridge.getEdges(), method)
    switch (resolution.kind) {
        case 'no-methods':
            notifyError(t('guides.errors.noMethods'))
            return
        case 'no-match':
            notifyError(t('guides.errors.noMatch', { method: resolution.method }))
            return
        case 'found':
            bridge.centerOnNode(resolution.nodeId)
            useWorkflowGuideStore.getState().start({
                guideId, nodeId: resolution.nodeId, methodLabel: resolution.label,
            })
            return
        default: {
            const _exhaustive: never = resolution
            return _exhaustive
        }
    }
}
