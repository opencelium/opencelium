import { http, HttpResponse } from 'msw'
import type { ConnectionTemplate } from '@entities/connectionTemplate/model/types'

let templates: ConnectionTemplate[] = [
    {
        id: 1,
        name: 'Jira → Confluence',
        description: 'Sync Jira issues to Confluence pages',
        connection: {
            fromConnector: { invoker: { name: 'Jira' } },
            toConnector: { invoker: { name: 'Confluence' } },
        },
    },
    {
        id: 2,
        name: 'GitHub → Slack',
        description: 'Notify Slack channel on GitHub events',
        connection: {
            fromConnector: { invoker: { name: 'GitHub' } },
            toConnector: { invoker: { name: 'Slack' } },
        },
    },
    {
        id: 3,
        name: 'Salesforce → HubSpot',
        description: 'Mirror Salesforce contacts into HubSpot',
        connection: {
            fromConnector: { invoker: { name: 'Salesforce' } },
            toConnector: { invoker: { name: 'HubSpot' } },
        },
    },
]

const uploadedFiles = new Map<string, string>()
let nextUploadId = 1000

export const connectionTemplateHandlers = [
    http.get('/template/all', () => {
        return HttpResponse.json(templates)
    }),

    http.get('/template/check/:name', ({ params }) => {
        const name = String(params.name ?? '')
        const exists = templates.some((t) => t.name === name) || uploadedFiles.has(name)
        return HttpResponse.json(exists)
    }),

    http.post('/storage/template', async ({ request }) => {
        const form = await request.formData()
        const file = form.get('file') as File | null
        const filename = file?.name ?? `template-${nextUploadId}.json`
        const id = String(nextUploadId++)
        uploadedFiles.set(filename, id)
        const existingIdx = templates.findIndex((t) => t.name === filename)
        const created: ConnectionTemplate = {
            id: Number(id),
            name: filename,
            description: `Uploaded from ${filename}`,
            connection: {
                fromConnector: { invoker: { name: 'Uploaded' } },
                toConnector: { invoker: { name: 'Uploaded' } },
            },
        }
        if (existingIdx >= 0) templates[existingIdx] = created
        else templates.push(created)
        return HttpResponse.json({ id, path: `/storage/template/${id}` })
    }),

    http.get('/template/:id', ({ params }) => {
        const id = Number(params.id)
        const found = templates.find((t) => t.id === id)
        if (!found) return HttpResponse.json({ message: 'Not found' }, { status: 404 })
        return HttpResponse.json(found)
    }),

    http.delete('/template/:id', ({ params }) => {
        const id = Number(params.id)
        templates = templates.filter((t) => t.id !== id)
        return new HttpResponse(null, { status: 204 })
    }),

    http.put('/template/list/delete', async ({ request }) => {
        const body = (await request.json()) as { identifiers: (number | string)[] }
        const ids = (body.identifiers ?? []).map((v) => Number(v))
        templates = templates.filter((t) => !ids.includes(t.id))
        return new HttpResponse(null, { status: 204 })
    }),
]
