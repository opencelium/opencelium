import { http, HttpResponse } from 'msw'
import type { SystemHealth, UpdateVersion } from '@entities/updateAssistant/model/types'

const mockHealth: SystemHealth = {
    status: 'DOWN',
    components: {
        email: {
            status: 'DOWN',
            details: {
                location: 'smtpintern.becon.de:25',
                error: "Couldn't connect to host, port: smtpintern.becon.de, 25; timeout -1",
            },
        },
        mariaDB: { status: 'UP', details: { version: '11.5.2-MariaDB', name: 'MariaDB' } },
        mongoDB: { status: 'UP', details: { name: 'MongoDB', version: '8.0.4' } },
        opencelium: { status: 'UP', details: { version: '4.8.2' } },
        os: { status: 'UP', details: { version: '10.0', name: 'Windows 11' } },
        polyglot: {
            status: 'DOWN',
            details: {
                name: 'Polyglot',
                error: "Couldn't establish a connection to Polyglot service. Check if it is running.",
            },
        },
    },
}

const mockOnlineVersions: UpdateVersion[] = [
    { name: '5.1.0', changelogLink: './assistant/changelog/file/5.1.0', status: 'new', instruction: '' },
    { name: '5.0.0', changelogLink: './assistant/changelog/file/5.0.0', status: 'current', instruction: '' },
    { name: '4.1.0', changelogLink: './assistant/changelog/file/4.1.0', status: 'old', instruction: '' },
]

let mockOfflineVersions: UpdateVersion[] = [
    { name: '4.1', changelogLink: './assistant/changelog/file/4.1', status: 'old', instruction: '' },
]

export const updateAssistantHandlers = [
    http.get('/actuator/health', () => HttpResponse.json(mockHealth)),

    http.get('/assistant/oc/online/version/all', () => HttpResponse.json(mockOnlineVersions)),

    http.get('/assistant/oc/offline/version/all', () => HttpResponse.json(mockOfflineVersions)),

    http.post('/assistant/zipfile', async ({ request }) => {
        const formData = await request.formData()
        const file = formData.get('file')
        if (!(file instanceof File)) {
            return new HttpResponse(null, { status: 400 })
        }

        try {
            await new Promise<void>((resolve, reject) => {
                if (request.signal.aborted) {
                    reject(new DOMException('Aborted', 'AbortError'))
                    return
                }
                const timer = setTimeout(resolve, 2000)
                request.signal.addEventListener(
                    'abort',
                    () => {
                        clearTimeout(timer)
                        reject(new DOMException('Aborted', 'AbortError'))
                    },
                    { once: true },
                )
            })
        } catch {
            return new HttpResponse(null, { status: 499 })
        }

        const name = file.name.replace(/\.zip$/i, '')
        if (!mockOfflineVersions.some((v) => v.name === name)) {
            mockOfflineVersions = [
                ...mockOfflineVersions,
                { name, changelogLink: `./assistant/changelog/file/${name}`, status: 'available', instruction: '' },
            ]
        }
        return new HttpResponse(null, { status: 200 })
    }),

    http.post('/assistant/oc/update', () => new HttpResponse(null, { status: 200 })),

    http.delete('/assistant/zipfile/:version', ({ params }) => {
        const idx = mockOfflineVersions.findIndex((v) => v.name === decodeURIComponent(params.version as string))
        if (idx !== -1) mockOfflineVersions.splice(idx, 1)
        return new HttpResponse(null, { status: 200 })
    }),
]
