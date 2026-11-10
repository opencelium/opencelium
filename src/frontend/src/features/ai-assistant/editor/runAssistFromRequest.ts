import { i18n } from '@shared/i18n/config/i18n'
import { workflowAssistBridgeStore } from '@features/workflow/command/workflowAssistBridge'
import { workflowCommandBridgeStore } from '@features/workflow/command/workflowCommandBridge'
import { resolveGuideNode } from '@features/onboarding/guides/model/resolveGuideNode'
import type { TestRunMode } from '@features/workflow/test-run/testRunModePreference'
import { tell } from './tell'

/** Run and debug by request: each is a button of the editor, so the option ids are what the gateway picks between. */
export const ASSIST_OPTIONS = {
    // "Test getCustomers" is the try-a-method guide, whatever the model picked.
    'test-workflow': { descriptionKey: 'commandPalette.descriptions.workflowTestRun', isAction: true, withMethod: 'method-try' },
    'stop-test': { descriptionKey: 'commandPalette.descriptions.workflowStopTest', isAction: true },
    // Not actions: "why did it fail?" and "how do I fix it?" are questions these answer, not ones to refuse.
    'explain-failure': { descriptionKey: 'commandPalette.descriptions.workflowExplainFailure', isAction: false },
    'fix-failure': { descriptionKey: 'commandPalette.descriptions.workflowFixFailure', isAction: false },
    'apply-fix': { descriptionKey: 'commandPalette.descriptions.workflowApplyFix', isAction: true },
    'explain-workflow': { descriptionKey: 'commandPalette.descriptions.workflowExplain', isAction: false },
    'show-logs': { descriptionKey: 'commandPalette.descriptions.workflowShowLogs', isAction: false },
    'show-problems': { descriptionKey: 'commandPalette.descriptions.workflowShowProblems', isAction: false },
    'undo': { descriptionKey: 'commandPalette.descriptions.workflowUndo', isAction: true },
    'redo': { descriptionKey: 'commandPalette.descriptions.workflowRedo', isAction: true },
    'save-workflow': { descriptionKey: 'commandPalette.descriptions.workflowSave', isAction: true },
    'delete-step': { descriptionKey: 'commandPalette.descriptions.workflowDeleteStep', isAction: true },
    'generate-workflow': { descriptionKey: 'commandPalette.descriptions.workflowGenerate', isAction: true },
    // Not an action: "how does the editor work?" is a fair reason to start it.
    'start-tutorial': { descriptionKey: 'commandPalette.descriptions.workflowStartTutorial', isAction: false },
} as const

export type AssistOptionId = keyof typeof ASSIST_OPTIONS

export const ASSIST_OPTION_IDS = Object.keys(ASSIST_OPTIONS) as AssistOptionId[]

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

export const isAssistOptionId = (id: string): id is AssistOptionId => id in ASSIST_OPTIONS

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
