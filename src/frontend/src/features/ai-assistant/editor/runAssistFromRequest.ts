import { i18n } from '@shared/i18n/config/i18n'
import { workflowAssistBridgeStore } from '@features/workflow/command/workflowAssistBridge'
import { workflowCommandBridgeStore } from '@features/workflow/command/workflowCommandBridge'
import { resolveGuideNode } from '@features/onboarding/guides/model/resolveGuideNode'
import type { TestRunMode } from '@features/workflow/test-run/testRunModePreference'
import { tell } from './tell'
import type { EditorCapabilityIdOf } from './editorCapabilities'

/** Run and debug by request: each is a button of the editor. */
export type AssistOptionId = EditorCapabilityIdOf<'assist'>

type AssistMessageKey = 'testRunning' | 'testUnavailable' | 'noTestRunning' | 'noFailure' | 'notFixable' | 'noFix' | 'noSteps'
    | 'nothingToUndo' | 'nothingToRedo' | 'cannotSave' | 'deleteWhich' | 'generateUnavailable' | 'tutorialUnavailable'

/** What the routed request said besides the option: its text, and the method it names (empty when none). */
export type AssistRequest = { prompt: string; method: string }

// The mode names are the same in English and German ("Live-Test", "im Debug-Modus").
const LIVE_RE = /\blive\b/i
const DEBUG_RE = /\bdebug/i

/** The test mode the request names; null when it names none, or both. */
export function testModeOf(prompt: string): TestRunMode | null {
    const [isLive, isDebug] = [LIVE_RE.test(prompt), DEBUG_RE.test(prompt)]
    return isLive === isDebug ? null : isLive ? 'live' : 'debug'
}

/** The step a remove request means: the named method, else the selected step; never a guess. */
function stepToDelete(method: string): { nodeId: string; label: string } | 'unknown' | null {
    const bridge = workflowCommandBridgeStore.getState()
    const [nodes, edges] = [bridge.getNodes(), bridge.getEdges()]
    if (method) {
        const found = resolveGuideNode(nodes, edges, method)
        return found.kind === 'found' ? { nodeId: found.nodeId, label: found.label } : 'unknown'
    }
    const selected = nodes.find(node => node.selected && node.type !== 'start')
    return selected ? { nodeId: selected.id, label: selected.data.subtitle || selected.data.title } : null
}

/** Does what the request asked, or says why it cannot be done now; every outcome is told to the user. */
export async function runAssistFromRequest(id: AssistOptionId, request: AssistRequest): Promise<void> {
    const { handlers } = workflowAssistBridgeStore.getState()
    const t = i18n.getFixedT(i18n.language, 'common')
    const say = (key: AssistMessageKey) => { tell.info(t(`commandPalette.workflowAssist.${key}`)) }
    const fail = (key: AssistMessageKey) => { tell.error(t(`commandPalette.workflowAssist.${key}`)) }
    switch (id) {
        case 'test-workflow': {
            const mode = testModeOf(request.prompt)
            const outcome = handlers.startTest?.(mode) ?? 'unavailable'
            if (outcome === 'running') say('testRunning')
            if (outcome === 'unavailable') fail('testUnavailable')
            if (outcome === 'started' && mode) tell.success(t(`commandPalette.workflowAssist.testStarted.${mode}`))
            return
        }
        case 'stop-test':
            if (!handlers.stopTest?.()) say('noTestRunning')
            return
        case 'explain-failure':
            if (!handlers.explainFailure) return say('noFailure')
            handlers.showLogs?.()
            handlers.explainFailure()
            return
        case 'fix-failure':
            if (!handlers.fixFailure) return say('noFailure')
            handlers.showLogs?.()
            if (!handlers.fixFailure()) say('notFixable')
            return
        case 'apply-fix':
            if (!handlers.applyFix?.()) say('noFix')
            return
        case 'explain-workflow':
            if (!handlers.explainWorkflow) return say('noSteps')
            handlers.explainWorkflow()
            return
        case 'show-logs':
            handlers.showLogs?.()
            return
        case 'show-problems':
            handlers.showProblems?.()
            return
        case 'undo':
            if (!handlers.undo?.()) say('nothingToUndo')
            return
        case 'redo':
            if (!handlers.redo?.()) say('nothingToRedo')
            return
        case 'save-workflow':
            if (!handlers.saveWorkflow?.()) fail('cannotSave')
            return
        case 'delete-step': {
            const step = stepToDelete(request.method)
            if (step === null) return say('deleteWhich')
            if (step === 'unknown') {
                tell.error(t('commandPalette.workflowEdit.unknownStep', { method: request.method }))
                return
            }
            if (!handlers.deleteStep) {
                tell.error(t('commandPalette.workflowEdit.notEditable'))
                return
            }
            if (await handlers.deleteStep(step)) tell.success(t('commandPalette.workflowAssist.deleted', { step: step.label }))
            return
        }
        case 'generate-workflow':
            if (!handlers.generateWorkflow) return fail('generateUnavailable')
            handlers.generateWorkflow(request.prompt)
            return
        case 'start-tutorial':
            if (!handlers.startTutorial) return say('tutorialUnavailable')
            handlers.startTutorial()
            return
        default: {
            const _exhaustive: never = id
            return _exhaustive
        }
    }
}
