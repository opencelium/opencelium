import { delay, http, HttpResponse } from 'msw'
import type { PlaygroundRequest } from '@features/workflow/request-playground/model/playground.types'
import { PLAYGROUND_URL } from '@features/workflow/request-playground/model/playgroundApi'
import { simulatePlaygroundRequest } from './simulatePlaygroundRequest'

// Wildcard origin: baseQuery prefixes the relative path with runtimeConfig.apiUrl,
// so a bare path pattern would only match the dev server's own origin.
const PLAYGROUND_ROUTE = `*${PLAYGROUND_URL}`

const SIMULATED_LATENCY_MS = 700

export const requestPlaygroundHandlers = [
    http.post(PLAYGROUND_ROUTE, async ({ request }) => {
        const body = (await request.json()) as PlaygroundRequest
        await delay(SIMULATED_LATENCY_MS)
        return HttpResponse.json(simulatePlaygroundRequest(body))
    }),
]
