import { store } from '@app/store/store'
import { i18n } from '@shared/i18n/config/i18n'
import { guideMethodNames } from '@features/onboarding/guides/model/resolveGuideNode'
import { startWorkflowGuide } from '@features/onboarding/guides/model/startWorkflowGuide'
import { workflowCommandBridgeStore } from '@features/workflow/command/workflowCommandBridge'
import { aiApi } from '../api/aiApi'
import { addMethodFromRequest, type ConfirmEdit } from './addMethodFromRequest'
import { suggestMappingFromRequest } from './suggestMappingFromRequest'
import { applyTransformationFromRequest } from './applyTransformationFromRequest'
import { addOperatorFromRequest } from './addOperatorFromRequest'
import { isQuiet } from './tell'
import { openMethodPartFromRequest } from './openMethodPartFromRequest'
import { runAssistFromRequest } from './runAssistFromRequest'
import { describeEditorCapabilities, type EditorCapabilityIdOf, isCapabilityOfKind, isEditorCapabilityId } from './editorCapabilities'

/** `handled`: a guide or an edit took the request over and told the user how it went; `unhandled`: it is for the palette. */
export type EditorRequestOutcome = 'handled' | 'unhandled'

// Too short for the model to place; it always means the selected step.
const REMOVE_SELECTED_RE = /^(remove|delete) (it|this|that|this step|the selected step)$|^(entferne|lösche) (ihn|es|das|diesen schritt|den ausgewählten schritt)$/i

type EditRequest = { prompt: string; method: string; confirmEdit?: ConfirmEdit }

/** The edits the AI reads the request for; each tells the user how it went. */
const EDITS: Record<EditorCapabilityIdOf<'edit'>, (request: EditRequest) => Promise<unknown> | void> = {
    'add-method': ({ prompt, confirmEdit }) => addMethodFromRequest(prompt, confirmEdit),
    'suggest-mapping': ({ prompt }) => suggestMappingFromRequest(prompt),
    // Addressed by name, the transformation is applied at once; otherwise it is proposed.
    'apply-transformation': ({ prompt, confirmEdit }) => applyTransformationFromRequest(prompt, !confirmEdit),
    'open-body': ({ method }) => openMethodPartFromRequest('body', method),
    'open-headers': ({ method }) => openMethodPartFromRequest('header', method),
    'add-operator': ({ prompt }) => addOperatorFromRequest(prompt),
}

/** Both languages, whatever the UI's: the request may be spoken in either. */
function describeOptions() {
    const translators = { en: i18n.getFixedT('en', 'common'), de: i18n.getFixedT('de', 'common') }
    return describeEditorCapabilities((language, key) => translators[language](key))
}

function startGuide(id: EditorCapabilityIdOf<'guide'>, prompt: string, method: string): EditorRequestOutcome {
    // The transformation guide goes into the headers when the request says so ("… in the headers of X").
    const part = /\b(headers?|kopfzeilen?)\b/i.test(prompt) ? 'header' : 'body'
    const started = startWorkflowGuide(id, method || undefined, { part, isQuiet: isQuiet() })
    // A named method that is not there was already reported; the palette would only guess.
    return started === 'started' || started === 'no-match' || started === 'no-methods' || started === 'no-references' ? 'handled' : 'unhandled'
}

/**
 * A request made in the workflow editor that the workflow itself answers: "where is the
 * header of getCustomers?" starts a guide, "add get all users from CRM after createClient"
 * adds the method, "suggest references for createClient from getCustomers" opens the AI mapping, "apply
 * transformation for Vendor with upper case" writes the script of a field in the open body or headers, "open the body
 * of getCustomers" opens it (where "where is …" walks there), "test the
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
    const id = answer.guideId
    if (!id || !isEditorCapabilityId(id)) return 'unhandled'
    if (isCapabilityOfKind(id, 'guide')) return startGuide(id, prompt, answer.method)
    if (isCapabilityOfKind(id, 'assist')) await runAssistFromRequest(id, { prompt, method: answer.method })
    else await EDITS[id]({ prompt, method: answer.method, confirmEdit })
    return 'handled'
}
