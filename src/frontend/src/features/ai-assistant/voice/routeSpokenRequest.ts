import { askWorkflowGuide } from '@features/onboarding/guides/model/askWorkflowGuide'
import { workflowCommandBridgeStore } from '@features/workflow/command/workflowCommandBridge'
import { useSpokenRequestStore } from './spokenRequest.store'

/**
 * Where a request spoken to the assistant goes. In the workflow editor a "where is …"
 * guide is tried first: the palette's AI reads "where" as a question for the help
 * assistant, and only the guide knows the workflow's own methods. Everything else is
 * handled by the palette exactly as if it had been spoken into its microphone.
 */
export async function routeSpokenRequest(text: string): Promise<void> {
    if (workflowCommandBridgeStore.getState().isActive) {
        const result = await askWorkflowGuide(text)
        // A named method that is not there was already reported; the palette would only guess.
        if (result === 'started' || result === 'no-match' || result === 'no-methods') return
    }
    useSpokenRequestStore.getState().send(text)
}
