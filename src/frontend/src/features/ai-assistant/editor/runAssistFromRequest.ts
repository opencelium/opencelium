import { message } from 'antd'
import { i18n } from '@shared/i18n/config/i18n'
import { notifyError } from '@shared/ui/feedback/notifyError'
import { workflowAssistBridgeStore } from '@features/workflow/command/workflowAssistBridge'

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
} as const

export type AssistOptionId = keyof typeof ASSIST_OPTIONS

export const ASSIST_OPTION_IDS = Object.keys(ASSIST_OPTIONS) as AssistOptionId[]

type AssistMessageKey = 'testRunning' | 'testUnavailable' | 'noTestRunning' | 'noFailure' | 'notFixable' | 'noFix' | 'noSteps'

export const isAssistOptionId = (id: string): id is AssistOptionId => id in ASSIST_OPTIONS

/** Does what the request asked, or says why it cannot be done now; every outcome is told to the user. */
export function runAssistFromRequest(id: AssistOptionId): void {
    const { handlers } = workflowAssistBridgeStore.getState()
    const t = i18n.getFixedT(i18n.language, 'common')
    const say = (key: AssistMessageKey) => { message.info(t(`commandPalette.workflowAssist.${key}`)) }
    const fail = (key: AssistMessageKey) => { notifyError(t(`commandPalette.workflowAssist.${key}`)) }
    switch (id) {
        case 'test-workflow': {
            const outcome = handlers.startTest?.() ?? 'unavailable'
            if (outcome === 'running') say('testRunning')
            if (outcome === 'unavailable') fail('testUnavailable')
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
        default: {
            const _exhaustive: never = id
            return _exhaustive
        }
    }
}
