import { delay, http, HttpResponse } from 'msw'
import type {
    FieldBindingSuggestionRequest,
    FieldBindingSuggestionResponse,
} from '@features/workflow/ai/fieldBindingSuggestion.types'
import { suggestFieldBindings } from './suggestFieldBindings'

// Wildcard origin: baseQuery prefixes every relative path with runtimeConfig.apiUrl, so the
// request leaves as http://<backend>/ai/... while a bare '/ai/...' pattern would only match
// the dev server's own origin.
const SUGGESTION_ROUTE = '*/ai/field-binding-suggestions'

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
]
