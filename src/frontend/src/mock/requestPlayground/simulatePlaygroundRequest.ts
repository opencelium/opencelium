import { PAYLOAD_REFERENCE_RE } from '@features/workflow/api/connectionPayload.references'
import type {
    PlaygroundRequest,
    PlaygroundResponse,
} from '@features/workflow/request-playground/model/playground.types'
import {
    connectionFieldSubstitution,
    referenceSubstitution,
    resolveRequest,
    webhookSubstitution,
} from '@features/workflow/request-playground/model/resolveRequest'

// Stand-in for the backend: substitutes each supplied value for its reference and
// echoes the resolved request back. Enhancement scripts are treated as the default
// `RESULT_VAR = VAR_0`, and an upstream run as one that answers every reference with
// a placeholder — running either is the part only the backend can do.

const UPSTREAM_VALUE = 'upstream-value'

const randomMs = (base: number, spread: number) => base + Math.round(Math.random() * spread)

export function simulatePlaygroundRequest(request: PlaygroundRequest): PlaygroundResponse {
    const upstreamAnswer = {
        pattern: new RegExp(PAYLOAD_REFERENCE_RE.source, 'g'),
        whole: new RegExp(`^(?:${PAYLOAD_REFERENCE_RE.source})$`),
        value: UPSTREAM_VALUE,
    }
    // Supplied values come first, so the upstream answer only fills what is still open.
    const sent = resolveRequest(request.method, [
        ...request.references.map(({ reference, value }) => referenceSubstitution(reference, value)),
        ...request.webhooks.map(({ name, value }) => webhookSubstitution(name, value)),
        ...Object.entries(request.requestData).map(([field, value]) => connectionFieldSubstitution(field, value)),
        ...(request.runUpstream ? [upstreamAnswer] : []),
    ])
    if (new RegExp(PAYLOAD_REFERENCE_RE.source).test(sent.url)) {
        return { kind: 'error', stage: 'resolve', message: 'The URL still contains an unresolved reference.', request: sent }
    }
    const timings = {
        dnsMs: randomMs(2, 6),
        connectMs: randomMs(8, 10),
        tlsMs: randomMs(20, 15),
        firstByteMs: randomMs(120, 300),
        downloadMs: randomMs(3, 8),
    }
    return {
        kind: 'success',
        request: sent,
        response: {
            status: 200,
            headers: { 'content-type': 'application/json', 'x-mock': 'request-playground' },
            body: { mocked: true, receivedBody: sent.body },
        },
        durationMs: Object.values(timings).reduce((sum, ms) => sum + ms, 0),
        timings,
    }
}
