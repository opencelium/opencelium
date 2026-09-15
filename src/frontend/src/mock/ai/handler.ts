import { delay, http, HttpResponse } from 'msw'
import type {
    FieldBindingSuggestionRequest,
    FieldBindingSuggestionResponse,
} from '@features/workflow/ai/fieldBindingSuggestion.types'
import type {
    EnhancementScriptRequest,
    EnhancementScriptResponse,
} from '@features/workflow/ai/enhancementScript.types'
import { suggestFieldBindings } from './suggestFieldBindings'
import { generateEnhancementScript } from './generateEnhancementScript'

// Wildcard origin: baseQuery prefixes every relative path with runtimeConfig.apiUrl, so the
// request leaves as http://<backend>/ai/... while a bare '/ai/...' pattern would only match
// the dev server's own origin.
const SUGGESTION_ROUTE = '*/ai/field-binding-suggestions'
const ENHANCEMENT_SCRIPT_ROUTE = '*/ai/enhancement-script'

/** Roughly what a cached-prefix model call costs, so the UI's loading state is exercised. */
const SIMULATED_LATENCY_MS = 900

export const aiHandlers = [
    http.post(SUGGESTION_ROUTE, async ({ request }) => {
        const body = (await request.json()) as FieldBindingSuggestionRequest
        await delay(SIMULATED_LATENCY_MS)
        const response: FieldBindingSuggestionResponse = {
            suggestions: suggestFieldBindings(body),
        }
        return HttpResponse.json(response)
    }),

    http.post(ENHANCEMENT_SCRIPT_ROUTE, async ({ request }) => {
        const body = (await request.json()) as EnhancementScriptRequest
        await delay(SIMULATED_LATENCY_MS)
        const response: EnhancementScriptResponse = generateEnhancementScript(body)
        return HttpResponse.json(response)
    }),
]
