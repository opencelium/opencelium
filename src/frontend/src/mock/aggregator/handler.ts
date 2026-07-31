import { http, HttpResponse } from 'msw'
import type { DataAggregator, DataAggregatorDto } from '@entities/dataAggregator/model/types'

export let aggregators: DataAggregator[] = [
    {
        id: 1,
        name: 'userAggregator',
        script: '/* \n\tHere are variables that came from arguments and can be used\n\tin the script. Requests and Responses variables hold the method\'s\n\tHTTP calls as arrays of objects, one per call:\n\t\theader - header data\n\t\tbody - request/response body data\n\t\tstatus - HTTP status code (Responses only; Requests entries have no status)\n*/\nvar firstName;\nvar lastName;\nvar email;\n\n/*\nPlease, define the initial value for your variables.\nIn this section you can define a logic of your script.\n*/\n',
        active: true,
        args: [
            { id: 101, name: 'firstName', description: 'User first name' },
            { id: 102, name: 'lastName', description: 'User last name' },
            { id: 103, name: 'email', description: 'User email address' },
        ],
    },
    {
        id: 2,
        name: 'orderAggregator',
        script: '/* \n\tHere are variables that came from arguments and can be used\n\tin the script. Requests and Responses variables hold the method\'s\n\tHTTP calls as arrays of objects, one per call:\n\t\theader - header data\n\t\tbody - request/response body data\n\t\tstatus - HTTP status code (Responses only; Requests entries have no status)\n*/\nvar orderId;\nvar total;\n\n/*\nPlease, define the initial value for your variables.\nIn this section you can define a logic of your script.\n*/\n',
        active: false,
        args: [
            { id: 201, name: 'orderId', description: 'Order identifier' },
            { id: 202, name: 'total', description: 'Order total amount' },
        ],
    },
]

let nextId = 3
let nextArgId = 300

export const aggregatorHandlers = [
    http.get('/aggregator/all', () => {
        return HttpResponse.json(aggregators)
    }),

    http.get('/aggregator/:nameOrId', ({ params }) => {
        const raw = params.nameOrId as string
        const asNumber = Number(raw)
        const found = isNaN(asNumber)
            ? aggregators.find((a) => a.name === raw)
            : aggregators.find((a) => a.id === asNumber)
        if (!found) return HttpResponse.json({ message: 'Not found' }, { status: 404 })
        return HttpResponse.json(found)
    }),

    http.post('/aggregator', async ({ request }) => {
        const body = await request.json() as DataAggregatorDto & { id?: number }

        if (body.id) {
            const id = body.id
            aggregators = aggregators.map((a) => {
                if (a.id !== id) return a
                const updatedArgs = (body.args ?? a.args).map((arg: any) => ({
                    id: arg.id ?? nextArgId++,
                    name: arg.name,
                    description: arg.description,
                }))
                return {
                    ...a,
                    name: body.name ?? a.name,
                    active: body.active ?? a.active,
                    script: body.script ?? a.script,
                    args: updatedArgs,
                }
            })
            const updated = aggregators.find((a) => a.id === id)
            if (!updated) return HttpResponse.json({ message: 'Not found' }, { status: 404 })
            return HttpResponse.json(updated)
        }

        const created: DataAggregator = {
            id: nextId++,
            name: body.name,
            active: body.active ?? true,
            script: body.script,
            args: (body.args ?? []).map((arg: any) => ({
                id: nextArgId++,
                name: arg.name,
                description: arg.description,
            })),
        }
        aggregators.push(created)
        return HttpResponse.json(created, { status: 201 })
    }),

    http.put('/aggregator/:id/status', async ({ params, request }) => {
        const id = Number(params.id)
        const body = (await request.json()) as { active: boolean }
        aggregators = aggregators.map((a) => (a.id === id ? { ...a, active: !!body.active } : a))
        const updated = aggregators.find((a) => a.id === id)
        if (!updated) return HttpResponse.json({ message: 'Not found' }, { status: 404 })
        return HttpResponse.json(updated)
    }),

    http.delete('/aggregator/:nameOrId', ({ params }) => {
        const raw = params.nameOrId as string
        const asNumber = Number(raw)
        aggregators = isNaN(asNumber)
            ? aggregators.filter((a) => a.name !== raw)
            : aggregators.filter((a) => a.id !== asNumber)
        return new HttpResponse(null, { status: 204 })
    }),
]
