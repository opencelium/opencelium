import { store } from '@app/store/store'
import { i18n } from '@shared/i18n/config/i18n'
import { aiApi } from '@features/ai-assistant/api/aiApi'
import { workflowCommandBridgeStore } from '@features/workflow/command/workflowCommandBridge'
import { guideMethodNames } from './resolveGuideNode'
import { startWorkflowGuide, type GuideStartResult } from './startWorkflowGuide'
import { WORKFLOW_GUIDE_IDS, WORKFLOW_GUIDES, type WorkflowGuideId } from './workflowGuides'

/** `no-guide`: the request asks for nothing a guide shows. `failed`: the AI gateway did not answer. */
export type AskGuideResult = GuideStartResult | 'no-guide' | 'failed'

const isGuideId = (id: string): id is WorkflowGuideId => (WORKFLOW_GUIDE_IDS as readonly string[]).includes(id)

/** Both languages, whatever the UI's: the request may be spoken in either. */
function describeGuides() {
    const [en, de] = [i18n.getFixedT('en', 'common'), i18n.getFixedT('de', 'common')]
    return WORKFLOW_GUIDE_IDS.map(id => {
        const key = WORKFLOW_GUIDES[id].descriptionKey
        return { id, description: [...new Set([en(key), de(key)])].join(' · ') }
    })
}

/**
 * Starts the guide a free-text request asks for ("where are the headers of getCustomers?"),
 * on the method it names. The gateway only reads the request; which node that method is,
 * and the fallback to the selected method, stay in `startWorkflowGuide`.
 */
export async function askWorkflowGuide(prompt: string): Promise<AskGuideResult> {
    const bridge = workflowCommandBridgeStore.getState()
    if (!bridge.isActive) return 'unavailable'
    const request = { prompt, guides: describeGuides(), methods: guideMethodNames(bridge.getNodes()) }
    let answer
    try {
        answer = await store.dispatch(aiApi.endpoints.routeGuide.initiate(request)).unwrap()
    } catch {
        return 'failed'
    }
    if (!answer.guideId || !isGuideId(answer.guideId)) return 'no-guide'
    return startWorkflowGuide(answer.guideId, answer.method || undefined)
}
