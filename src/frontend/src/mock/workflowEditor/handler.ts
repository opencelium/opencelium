import { http, HttpResponse } from 'msw'
import connectors from './connectors.json'
import connectorsMeta from './connectorsMeta.json'
import sampleWorkflow from './workflow.json'

// Enough backend for the workflow editor to open, edit and save without a server.
// Payloads were captured from a local backend (credentials were empty) and are kept as-is.
type StoredWorkflow = Record<string, unknown> & { connectionId: number; title: string }

const workflows = new Map<number, StoredWorkflow>(
    [1, 42, 68, 70, 72].map((id) => [id, { ...structuredClone(sampleWorkflow), connectionId: id, title: id === 1 ? sampleWorkflow.title : `Workflow ${id}` }]),
)
let nextWorkflowId = 100

export const workflowEditorHandlers = [
    http.get('/connector/all', () => HttpResponse.json(connectors)),
    http.get('/connector/meta/all', () => HttpResponse.json(connectorsMeta)),
    http.get('/connector/:id', ({ params }) => {
        const connector = connectors.find((item) => item.connectorId === Number(params.id))
        return connector ? HttpResponse.json(connector) : HttpResponse.json({ message: 'Connector not found' }, { status: 404 })
    }),

    http.get('/connection/check', () => HttpResponse.json({ result: true })),
    http.get('/connection/:id/versions', () => HttpResponse.json([])),
    http.get('/connection/:id', ({ params }) => {
        const workflow = workflows.get(Number(params.id))
        return workflow ? HttpResponse.json(workflow) : HttpResponse.json({ message: 'CONNECTION_NOT_FOUND' }, { status: 404 })
    }),
    http.post('/connection', async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>
        const saved = { ...body, connectionId: nextWorkflowId++, title: String(body.title ?? 'Workflow') }
        workflows.set(saved.connectionId, saved)
        return HttpResponse.json(saved)
    }),
    http.put('/connection/:id', async ({ params, request }) => {
        const body = (await request.json()) as Record<string, unknown>
        const saved = { ...body, connectionId: Number(params.id), title: String(body.title ?? 'Workflow') }
        workflows.set(saved.connectionId, saved)
        return HttpResponse.json(saved)
    }),

    http.get('/scheduler/all', () => HttpResponse.json([])),
]
