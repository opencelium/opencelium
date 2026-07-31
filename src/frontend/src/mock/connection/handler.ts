import { http, HttpResponse } from 'msw'
import type { Connection } from '@entities/connection/model/types'

const baseConnector = {
    connectorId: 21,
    title: 'fake',
    description: '',
    invoker: {
        name: 'fake_api',
        description: 'Fake api description',
        hint: 'Any hints here',
        icon: './storage/files/fake_api.png',
        authType: 'basic',
        hasManualSync: false,
    },
    sslCert: false,
    timeout: 1000,
}

let connections: Connection[] = [
    {
        id: 68,
        title: 'test',
        description: '',
        fromConnector: { ...baseConnector },
        toConnector: { ...baseConnector },
    },
    {
        id: 70,
        title: 'sadas',
        description: '',
        fromConnector: { ...baseConnector },
        toConnector: { ...baseConnector },
    },
    {
        id: 72,
        title: 'fake',
        description: '',
        fromConnector: { ...baseConnector },
        toConnector: { ...baseConnector },
    },
]

let nextTemplateId = 1000

export const connectionHandlers = [
    http.get('/connection/all/meta', () => {
        return HttpResponse.json(connections)
    }),

    http.put('/connection/list/delete', async ({ request }) => {
        const body = (await request.json()) as { identifiers?: (number | string)[] }
        const ids = new Set((body.identifiers ?? []).map((v) => Number(v)))
        connections = connections.filter((c) => !ids.has(c.id))
        return HttpResponse.json({ valid: true })
    }),

    http.delete('/connection/:id', ({ params }) => {
        const id = Number(params.id)
        connections = connections.filter((c) => c.id !== id)
        return HttpResponse.json({ valid: true })
    }),

    http.get('/template/connection/:id', ({ params }) => {
        const id = Number(params.id)
        const connection = connections.find((c) => c.id === id)
        if (!connection) {
            return HttpResponse.json({ message: 'Connection not found' }, { status: 404 })
        }
        const templateId = String(nextTemplateId++)
        return HttpResponse.json({
            templateId,
            name: connection.title,
            description: connection.description,
            version: '1.0.0',
            connection,
        })
    }),
]
