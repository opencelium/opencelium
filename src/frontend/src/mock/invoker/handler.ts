import { http, HttpResponse } from 'msw'
import type { Invoker, InvokerMeta } from '@entities/invoker/model/types'

export let invokers: Invoker[] = [
    {
        name: 'SampleRestInvoker',
        description: 'A sample RESTful invoker',
        hint: 'Use with REST API connectors',
        icon: '',
        authType: 'basic',
        hasManualSync: false,
        requiredData: {
            url: 'https://api.example.com',
            username: 'admin',
            password: '',
            token: '',
        },
        operations: [
            {
                name: 'getAll',
                type: '',
                request: {
                    endpoint: '/items',
                    method: 'GET',
                    header: { 'Content-Type': 'application/json' },
                    body: { data: 'raw', format: 'json', type: 'object', fields: {} },
                },
                response: {
                    name: 'getAll',
                    success: {
                        status: '200',
                        header: {},
                        body: { data: 'raw', format: 'json', type: 'array', fields: {} },
                    },
                    fail: {
                        status: '400',
                        header: {},
                        body: { data: 'raw', format: 'json', type: 'object', fields: {} },
                    },
                },
            },
        ],
    },
]

/** What the mocked invoker repository holds, mirroring the real catalog's shape. */
const REPOSITORY_INVOKERS: Invoker[] = [
    {
        name: 'jira',
        description: 'Atlassian Jira REST API',
        hint: 'Set url, username and api token',
        icon: '/assets/images/invoker/jira.png',
        authType: 'basic',
        hasManualSync: false,
        requiredData: { url: '', username: '', password: '' },
        operations: [],
    },
    {
        name: 'zabbix',
        description: 'Zabbix monitoring API',
        hint: 'Set url and api token',
        icon: '/assets/images/invoker/zabbix.png',
        authType: 'token',
        hasManualSync: false,
        requiredData: { url: '', token: '' },
        operations: [],
    },
]

export const invokerHandlers = [
    // Overwrites by name, exactly as the backend does; `operations` is stripped
    // from the reply because the real endpoint answers with metadata only.
    http.post('/invoker/remote', () => {
        const installed: InvokerMeta[] = REPOSITORY_INVOKERS.map((repo) => {
            const meta = { ...repo } as Partial<Invoker>
            delete meta.operations
            return meta as InvokerMeta
        })
        invokers = [
            ...invokers.filter((inv) => !REPOSITORY_INVOKERS.some((repo) => repo.name === inv.name)),
            ...REPOSITORY_INVOKERS,
        ]
        return HttpResponse.json({ installed, failed: [] })
    }),

    http.get('/invoker/all', () => {
        return HttpResponse.json(invokers)
    }),

    http.get('/invoker/:name', ({ params }) => {
        const name = params.name as string
        const found = invokers.find((inv) => inv.name === name)
        if (!found) return HttpResponse.json({ message: 'Not found' }, { status: 404 })
        return HttpResponse.json(found)
    }),

    http.post('/invoker', async ({ request }) => {
        const body = await request.json() as { name: string; xml: string }
        const existing = invokers.find((inv) => inv.name === body.name)
        if (existing) {
            return HttpResponse.json({ message: 'Invoker with this name already exists' }, { status: 409 })
        }
        const created: Invoker = {
            name: body.name,
            description: '',
            hint: '',
            icon: '',
            authType: 'basic',
            hasManualSync: false,
            requiredData: {},
            operations: [],
        }
        invokers.push(created)
        return HttpResponse.json(created, { status: 201 })
    }),

    http.delete('/invoker/:name', ({ params }) => {
        const name = params.name as string
        invokers = invokers.filter((inv) => inv.name !== name)
        return new HttpResponse(null, { status: 204 })
    }),
]
