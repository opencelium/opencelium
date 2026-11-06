import { store } from '@app/store/store'
import { i18n } from '@shared/i18n/config/i18n'
import { guideMethodNames } from '@features/onboarding/guides/model/resolveGuideNode'
import { startWorkflowGuide } from '@features/onboarding/guides/model/startWorkflowGuide'
import { WORKFLOW_GUIDE_IDS, WORKFLOW_GUIDES, type WorkflowGuideId } from '@features/onboarding/guides/model/workflowGuides'
import { workflowCommandBridgeStore } from '@features/workflow/command/workflowCommandBridge'
import { aiApi } from '../api/aiApi'
import { addMethodFromRequest, type ConfirmEdit } from './addMethodFromRequest'
import { suggestMappingFromRequest } from './suggestMappingFromRequest'
import { applyTransformationFromRequest } from './applyTransformationFromRequest'
import { addOperatorFromRequest } from './addOperatorFromRequest'
import { ASSIST_OPTIONS, ASSIST_OPTION_IDS, isAssistOptionId, runAssistFromRequest } from './runAssistFromRequest'

/** What the editor itself can do with a request, besides the guides. */
const ADD_METHOD = 'add-method'
const ADD_METHOD_DESCRIPTION = 'commandPalette.descriptions.workflowAddMethod'
const SUGGEST_MAPPING = 'suggest-mapping'
const SUGGEST_MAPPING_DESCRIPTION = 'commandPalette.descriptions.workflowSuggestMapping'
const APPLY_TRANSFORMATION = 'apply-transformation'
const APPLY_TRANSFORMATION_DESCRIPTION = 'commandPalette.descriptions.workflowApplyTransformation'
const ADD_OPERATOR = 'add-operator'
const ADD_OPERATOR_DESCRIPTION = 'commandPalette.descriptions.workflowAddOperator'

/** `handled`: a guide or an edit took the request over and told the user how it went; `unhandled`: it is for the palette. */
export type EditorRequestOutcome = 'handled' | 'unhandled'

// Too short for the model to place; it always means the selected step.
const REMOVE_SELECTED_RE = /^(remove|delete) (it|this|that|this step|the selected step)$|^(entferne|lösche) (ihn|es|das|diesen schritt|den ausgewählten schritt)$/i

const isGuideId = (id: string): id is WorkflowGuideId => (WORKFLOW_GUIDE_IDS as readonly string[]).includes(id)

/** Both languages, whatever the UI's: the request may be spoken in either. */
function describeOptions() {
    const [en, de] = [i18n.getFixedT('en', 'common'), i18n.getFixedT('de', 'common')]
    const describe = (key: string) => [...new Set([en(key), de(key)])].join(' · ')
    return [
        ...WORKFLOW_GUIDE_IDS.map(id => ({
            id, description: describe(WORKFLOW_GUIDES[id].descriptionKey),
            ...(id === 'method-transformation' ? { teaches: APPLY_TRANSFORMATION } : {}),
        })),
        { id: ADD_METHOD, description: describe(ADD_METHOD_DESCRIPTION), isAction: true },
        { id: SUGGEST_MAPPING, description: describe(SUGGEST_MAPPING_DESCRIPTION), isAction: true },
        { id: APPLY_TRANSFORMATION, description: describe(APPLY_TRANSFORMATION_DESCRIPTION), isAction: true },
        { id: ADD_OPERATOR, description: describe(ADD_OPERATOR_DESCRIPTION), isAction: true },
        ...ASSIST_OPTION_IDS.map(id => {
            const option: { descriptionKey: string; isAction: boolean; withMethod?: string } = ASSIST_OPTIONS[id]
            return { id, description: describe(option.descriptionKey), isAction: option.isAction,
                ...(option.withMethod ? { withMethod: option.withMethod } : {}) }
        }),
    ]
}

/**
 * A request made in the workflow editor that the workflow itself answers: "where is the
 * header of getCustomers?" starts a guide, "add get all users from CRM after createClient"
 * adds the method, "suggest references for createClient from getCustomers" opens the AI mapping, "apply
 * transformation for Vendor with upper case" writes the script of a field in the open body or headers, "test the
 * workflow" / "why did it fail?" / "fix it" run and debug it. `confirmEdit` is asked before a change; leave it out when the user
 * addressed the assistant by name, which is their go-ahead.
 */
export async function askWorkflowEditor(prompt: string, confirmEdit?: ConfirmEdit): Promise<EditorRequestOutcome> {
    const bridge = workflowCommandBridgeStore.getState()
    if (!bridge.isActive) return 'unhandled'
    if (REMOVE_SELECTED_RE.test(prompt.trim().replace(/[.!?]+$/, ''))) {
        await runAssistFromRequest('delete-step', { prompt, method: '' })
        return 'handled'
    }
    const request = { prompt, guides: describeOptions(), methods: guideMethodNames(bridge.getNodes()) }
    let answer
    try {
        answer = await store.dispatch(aiApi.endpoints.routeGuide.initiate(request)).unwrap()
    } catch {
        return 'unhandled'
    }
    if (answer.guideId === ADD_METHOD) {
        await addMethodFromRequest(prompt, confirmEdit)
        return 'handled'
    }
    if (answer.guideId === APPLY_TRANSFORMATION) {
        await applyTransformationFromRequest(prompt, !confirmEdit)
        return 'handled'
    }
    if (answer.guideId === SUGGEST_MAPPING) {
        await suggestMappingFromRequest(prompt)
        return 'handled'
    }
    if (answer.guideId && isAssistOptionId(answer.guideId)) {
        await runAssistFromRequest(answer.guideId, { prompt, method: answer.method })
        return 'handled'
    }
    if (answer.guideId === ADD_OPERATOR) {
        await addOperatorFromRequest(prompt)
        return 'handled'
    }
    if (!answer.guideId || !isGuideId(answer.guideId)) return 'unhandled'
    // The transformation guide goes into the headers when the request says so ("… in the headers of X").
    const part = /\b(headers?|kopfzeilen?)\b/i.test(prompt) ? 'header' : 'body'
    const started = startWorkflowGuide(answer.guideId, answer.method || undefined, { part })
    // A named method that is not there was already reported; the palette would only guess.
    return started === 'started' || started === 'no-match' || started === 'no-methods' || started === 'no-references' ? 'handled' : 'unhandled'
}
