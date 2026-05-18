import { http, HttpResponse } from 'msw'
import type { NotificationTemplate, NotificationTemplateDto } from '@entities/notificationTemplate/model/types'

const MESSAGE_TYPES = ['EMAIL', 'SMS', 'SLACK', 'TEAMS', 'WEBHOOK']

let templates: NotificationTemplate[] = [
    {
        templateId: 1,
        name: 'Welcome Email',
        type: 'EMAIL',
        content: [
            {
                contentId: 1,
                subject: 'Welcome, {{101}}!',
                body: 'Hello {{101}} {{102}},\n\nWelcome to our platform!\n\nBest regards,\nThe Team',
                language: 'en',
            },
        ],
    },
]

let nextId = 2
let nextContentId = 2

export const notificationTemplateHandlers = [
    http.get('/message/tools/all', () => {
        return HttpResponse.json(MESSAGE_TYPES)
    }),

    http.get('/message/all', () => {
        return HttpResponse.json(templates)
    }),

    http.get('/message/:nameOrId', ({ params }) => {
        const raw = params.nameOrId as string
        const asNumber = Number(raw)
        const found = isNaN(asNumber)
            ? templates.find((t) => t.name === raw)
            : templates.find((t) => t.templateId === asNumber)
        if (!found) return HttpResponse.json({ message: 'Not found' }, { status: 404 })
        return HttpResponse.json(found)
    }),

    http.post('/message', async ({ request }) => {
        const body = await request.json() as NotificationTemplateDto & { templateId?: number }

        // Update: body contains templateId
        if (body.templateId) {
            const id = body.templateId
            templates = templates.map((t) =>
                t.templateId === id
                    ? { ...t, name: body.name ?? t.name, type: body.type ?? t.type, content: body.content ?? t.content }
                    : t
            )
            const updated = templates.find((t) => t.templateId === id)
            if (!updated) return HttpResponse.json({ message: 'Not found' }, { status: 404 })
            return HttpResponse.json(updated)
        }

        // Create — assign contentId to each content item
        const created: NotificationTemplate = {
            templateId: nextId++,
            name: body.name,
            type: body.type,
            content: body.content.map((c) => ({ ...c, contentId: nextContentId++ })),
        }
        templates.push(created)
        return HttpResponse.json(created, { status: 201 })
    }),

    http.put('/message/:nameOrId', async ({ params, request }) => {
        const raw = params.nameOrId as string
        const asNumber = Number(raw)
        const body = await request.json() as Partial<NotificationTemplateDto>
        templates = templates.map((t) => {
            const matches = isNaN(asNumber) ? t.name === raw : t.templateId === asNumber
            if (!matches) return t
            return {
                ...t,
                name: body.name ?? t.name,
                type: body.type ?? t.type,
                content: body.content ?? t.content,
            }
        })
        const updated = isNaN(asNumber)
            ? templates.find((t) => t.name === (body.name ?? raw))
            : templates.find((t) => t.templateId === asNumber)
        if (!updated) return HttpResponse.json({ message: 'Not found' }, { status: 404 })
        return HttpResponse.json(updated)
    }),

    http.put('/message/list/delete', async ({ request }) => {
        const body = (await request.json()) as { identifiers: (number | string)[] }
        const ids = (body.identifiers ?? []).map((v) => Number(v))
        templates = templates.filter((t) => !ids.includes(t.templateId))
        return new HttpResponse(null, { status: 204 })
    }),

    http.delete('/message/:nameOrId', ({ params }) => {
        const raw = params.nameOrId as string
        const asNumber = Number(raw)
        templates = isNaN(asNumber)
            ? templates.filter((t) => t.name !== raw)
            : templates.filter((t) => t.templateId !== asNumber)
        return new HttpResponse(null, { status: 204 })
    }),
]
