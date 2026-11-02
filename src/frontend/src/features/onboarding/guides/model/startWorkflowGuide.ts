import { i18n } from '@shared/i18n/config/i18n'
import { notifyError } from '@shared/ui/feedback/notifyError'
import { WAKE_WORD } from '@features/ai-assistant/voice/wakeWord'
import { workflowCommandBridgeStore } from '@features/workflow/command/workflowCommandBridge'
import { useWorkflowTutorialStore } from '../../workflow-tutorial/model/workflowTutorial.store'
import { type GuideNodeResolution, resolveGuideNode } from './resolveGuideNode'
import { resolveTransformationNode, type TransformationResolution } from './transformationTarget'
import { type ActiveWorkflowGuide, type GuidePart, useWorkflowGuideStore } from './workflowGuide.store'
import type { WorkflowGuideId } from './workflowGuides'

/** Why a guide did or did not start; the problems are already reported to the user. */
export type GuideStartResult = 'started' | 'unavailable' | 'no-methods' | 'no-match' | 'no-references'

export type GuideOptions = {
    /** Body or headers, for the transformation guide; body when not said. */
    part?: GuidePart
}

/** The other guides point at a method, not into one of its fields. */
const withoutField = (resolution: GuideNodeResolution): TransformationResolution =>
    resolution.kind === 'found' ? { ...resolution, field: null } : resolution

/**
 * Starts a guide on the workflow open in the editor. Outside React on purpose: the
 * command palette and the voice assistant call it from plain executors.
 */
export function startWorkflowGuide(guideId: WorkflowGuideId, method?: string, { part = 'body' }: GuideOptions = {}): GuideStartResult {
    const bridge = workflowCommandBridgeStore.getState()
    // The tutorial owns the editor while it runs; two spotlights would fight over the page.
    if (!bridge.isActive || useWorkflowTutorialStore.getState().requested) return 'unavailable'

    const t = i18n.getFixedT(i18n.language, 'onboarding')
    const [nodes, edges] = [bridge.getNodes(), bridge.getEdges()]
    const resolution = guideId === 'method-transformation'
        ? resolveTransformationNode(nodes, edges, part, method)
        : withoutField(resolveGuideNode(nodes, edges, method))
    switch (resolution.kind) {
        case 'no-methods':
            notifyError(t('guides.errors.noMethods'))
            return 'no-methods'
        case 'no-match':
            notifyError(t('guides.errors.noMatch', { method: resolution.method }))
            return 'no-match'
        case 'no-references':
            notifyError(t('guides.errors.noReferences', { part: t(`guides.parts.${part}`), name: WAKE_WORD.name }))
            return 'no-references'
        case 'found': {
            bridge.centerOnNode(resolution.nodeId)
            const common = { nodeId: resolution.nodeId, methodLabel: resolution.label }
            const guide: ActiveWorkflowGuide = guideId === 'method-transformation'
                ? { guideId, ...common, part, field: resolution.field }
                : { guideId, ...common }
            useWorkflowGuideStore.getState().start(guide)
            return 'started'
        }
        default: {
            const _exhaustive: never = resolution
            return _exhaustive
        }
    }
}
