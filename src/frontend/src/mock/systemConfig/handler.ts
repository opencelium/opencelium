import {http, HttpResponse} from 'msw'
import type {
    ApplicationConfigPatchRequest,
    ApplicationConfigResponse,
    ConfigNode,
    EnvelopeComment,
} from '@entities/systemConfig/model/types'

function node(
    key: string,
    path: string,
    status: ConfigNode['status'],
    value: ConfigNode['value'],
    comments: ConfigNode['comments'] = [],
): ConfigNode {
    return {key, path, status, value, comments}
}

function initialFields(): ConfigNode[] {
    return [
        node('server', 'server', 'active', [
            node('port', 'server.port', 'active', 9090, [
                {position: 'inline', text: ' default http port'},
            ]),
            node('address', 'server.address', 'active', '127.0.0.1'),
            node('ssl', 'server.ssl', 'inactive', [
                node('enabled', 'server.ssl.enabled', 'inactive', true),
                node('key-store-type', 'server.ssl.key-store-type', 'inactive', 'PKCS12'),
            ]),
        ], [{position: 'before', text: ' Webserver configuration section'}]),
        node('spring', 'spring', 'active', [
            node('datasource', 'spring.datasource', 'active', [
                node('url', 'spring.datasource.url', 'active', 'jdbc:mariadb://localhost:3306/opencelium'),
                node('username', 'spring.datasource.username', 'active', 'root'),
                node('password', 'spring.datasource.password', 'active', 'root'),
            ]),
            node('mail', 'spring.mail', 'inactive', [
                node('host', 'spring.mail.host', 'inactive', 'smtp.gmail.com'),
                node('port', 'spring.mail.port', 'inactive', 587),
            ], [{position: 'before', text: ' Mail configuration section'}]),
        ]),
        node('opencelium', 'opencelium', 'active', [
            node('version', 'opencelium.version', 'active', 5.0),
            node('token', 'opencelium.token', 'active', [
                node('secret', 'opencelium.token.secret', 'active', '84bbce-secret-value'),
                node('activity-time', 'opencelium.token.activity-time', 'active', 18000),
            ]),
            node('cors', 'opencelium.cors', 'active', [
                node('origins', 'opencelium.cors.origins', 'active', ['http://localhost:3000']),
            ]),
            node('debug-mode', 'opencelium.debug-mode', 'active', true),
        ]),
    ]
}

const envelopeComments: EnvelopeComment[] = [
    {position: 'header', text: ' OpenCelium application configuration'},
    {position: 'footer', text: ' End of file'},
]

let fields: ConfigNode[] = initialFields()

function isContainer(n: ConfigNode): boolean {
    return Array.isArray(n.value) && n.value.length > 0 && typeof n.value[0] === 'object' && n.value[0] !== null
}

function findNode(nodes: ConfigNode[], path: string): ConfigNode | undefined {
    for (const n of nodes) {
        if (n.path === path) return n
        if (isContainer(n)) {
            const found = findNode(n.value as ConfigNode[], path)
            if (found) return found
        }
    }
    return undefined
}

/** Every active container must reach at least one active leaf descendant. */
function violatesInvariant(nodes: ConfigNode[]): string | null {
    for (const n of nodes) {
        if (isContainer(n)) {
            const inner = violatesInvariant(n.value as ConfigNode[])
            if (inner) return inner
            if (n.status === 'active' && !(n.value as ConfigNode[]).some((c) => c.status === 'active')) {
                return n.path
            }
        }
    }
    return null
}

function badRequest(message: string) {
    return HttpResponse.json(
        {
            timestamp: new Date().toISOString(),
            status: 400,
            error: 'BAD_REQUEST',
            message,
            path: '/application-config',
        },
        {status: 400},
    )
}

export const systemConfigHandlers = [
    http.get('/application-config', () => {
        const body: ApplicationConfigResponse = {fields, comments: envelopeComments}
        return HttpResponse.json(body)
    }),

    http.patch('/application-config', async ({request}) => {
        let body: unknown
        try {
            body = await request.json()
        } catch {
            return badRequest('Malformed JSON')
        }
        if (typeof body !== 'object' || body === null || Array.isArray(body)) {
            return badRequest('Body must be a JSON object')
        }
        const envelope = body as Partial<ApplicationConfigPatchRequest>
        if (!Array.isArray(envelope.fields)) {
            return badRequest('Missing or invalid "fields" array')
        }

        // Apply against a clone so we can validate before committing.
        const draft: ConfigNode[] = structuredClone(fields)
        for (const patch of envelope.fields) {
            if (!patch || typeof patch.path !== 'string') {
                return badRequest('Each field requires a "path"')
            }
            const target = findNode(draft, patch.path)
            if (!target) continue // unknown path → would be appended; skip in mock
            if (patch.status) target.status = patch.status
            if (patch.value !== undefined && !isContainer(target)) target.value = patch.value
        }

        const offending = violatesInvariant(draft)
        if (offending) {
            return badRequest(
                `Active section '${offending}' must have at least one active child. ` +
                    `Enable a child setting or set '${offending}' to inactive.`,
            )
        }

        fields = draft
        return HttpResponse.json({
            status: 'saved',
            restartRequired: true,
            message: 'Configuration saved. Restart the application for changes to take effect.',
        })
    }),
]
