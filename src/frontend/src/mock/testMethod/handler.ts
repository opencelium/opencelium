import { delay, http, HttpResponse } from 'msw'
import type { TestMethodRequest } from '@features/workflow/test-method/testMethod.types'
import { TEST_METHOD_URL } from '@features/workflow/test-method/testMethodApi'
import { simulateTestMethod } from './simulateTestMethod'

// Wildcard origin: baseQuery prefixes the relative path with runtimeConfig.apiUrl,
// so a bare path pattern would only match the dev server's own origin.
const TEST_METHOD_ROUTE = `*${TEST_METHOD_URL}`

const SIMULATED_LATENCY_MS = 700

export const testMethodHandlers = [
    http.post(TEST_METHOD_ROUTE, async ({ request }) => {
        const body = (await request.json()) as TestMethodRequest
        await delay(SIMULATED_LATENCY_MS)
        return HttpResponse.json(simulateTestMethod(body))
    }),
]
