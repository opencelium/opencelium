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
                node('key-store-password', 'server.ssl.key-store-password', 'inactive', 'root'),
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
            node('polyglot', 'opencelium.polyglot', 'inactive', [
                node('enabled', 'opencelium.polyglot.enabled', 'inactive', true, [
                    {position: 'before', text: ' Enables or disables the polyglot service integration.'},
                ]),
                node('protocol', 'opencelium.polyglot.protocol', 'inactive', 'http'),
                node('host', 'opencelium.polyglot.host', 'inactive', 'localhost'),
            ], [{position: 'before', text: '#######################\n   Polyglot Engine Configuration\n#######################'}]),
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

function indexTree(nodes: ConfigNode[], map = new Map<string, ConfigNode>()): Map<string, ConfigNode> {
    for (const n of nodes) {
        map.set(n.path, n)
        if (isContainer(n)) indexTree(n.value as ConfigNode[], map)
    }
    return map
}

function descendantsOf(n: ConfigNode): ConfigNode[] {
    if (!isContainer(n)) return []
    const out: ConfigNode[] = []
    for (const c of n.value as ConfigNode[]) {
        out.push(c, ...descendantsOf(c))
    }
    return out
}

function ancestorPaths(path: string): string[] {
    const parts = path.split('.')
    const out: string[] = []
    for (let i = 1; i < parts.length; i++) out.push(parts.slice(0, i).join('.'))
    return out
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

        const draft: ConfigNode[] = structuredClone(fields)
        const index = indexTree(draft)

        const activate: string[] = []
        const disable = new Set<string>()
        const valueEdits: {path: string; value: unknown}[] = []

        for (const patch of envelope.fields) {
            if (!patch || typeof patch.path !== 'string') {
                return badRequest('Each field requires a "path"')
            }
            const existing = index.get(patch.path)
            if (!existing) {
                // Unknown path: append a new key only when an active value is supplied.
                if (patch.status === 'active' && patch.value !== undefined) {
                    const parentPath = ancestorPaths(patch.path).at(-1)
                    const parent = parentPath ? index.get(parentPath) : undefined
                    if (parent && isContainer(parent)) {
                        const newNode = node(
                            patch.path.split('.').at(-1) as string,
                            patch.path,
                            'active',
                            patch.value as ConfigNode['value'],
                        )
                        ;(parent.value as ConfigNode[]).push(newNode)
                        index.set(patch.path, newNode)
                        continue
                    }
                }
                return badRequest(
                    `Cannot ${patch.status === 'inactive' ? 'disable' : 'enable'} unknown path '${patch.path}'`,
                )
            }
            if (patch.status === 'active') activate.push(patch.path)
            if (patch.status === 'inactive') disable.add(patch.path)
            if (patch.value !== undefined) valueEdits.push({path: patch.path, value: patch.value})
        }

        // Contradiction: activating a path whose ancestor is explicitly disabled.
        for (const a of activate) {
            const blockedBy = ancestorPaths(a).find((p) => disable.has(p))
            if (blockedBy) {
                return badRequest(
                    `Cannot activate '${a}' while ancestor '${blockedBy}' is being disabled in the same patch.`,
                )
            }
        }
        // Contradiction: activating a container while disabling all of its descendants.
        for (const a of activate) {
            const n = index.get(a)
            if (n && isContainer(n)) {
                const leaves = descendantsOf(n).filter((d) => !isContainer(d))
                if (leaves.length > 0 && leaves.every((d) => disable.has(d.path))) {
                    return badRequest(`Cannot activate '${a}' while disabling all its descendants.`)
                }
            }
        }

        // Apply activate (down + up), then value edits, then disable (down + up) — so an
        // explicit disable wins over the activate cascade, matching the writer order.
        for (const a of activate) {
            const n = index.get(a)
            if (!n) continue
            n.status = 'active'
            for (const d of descendantsOf(n)) d.status = 'active'
            for (const anc of ancestorPaths(a)) {
                const ancNode = index.get(anc)
                if (ancNode) ancNode.status = 'active'
            }
        }

        for (const {path, value} of valueEdits) {
            const n = index.get(path)
            if (n && !isContainer(n)) n.value = value as ConfigNode['value']
        }

        for (const d of disable) {
            const n = index.get(d)
            if (!n) continue
            n.status = 'inactive'
            for (const child of descendantsOf(n)) child.status = 'inactive'
            // Cascade up: disable each ancestor that is left with no active child.
            for (const anc of ancestorPaths(d).reverse()) {
                const ancNode = index.get(anc)
                if (!ancNode || !isContainer(ancNode)) continue
                const hasActiveChild = (ancNode.value as ConfigNode[]).some((c) => c.status === 'active')
                if (ancNode.status === 'active' && !hasActiveChild) ancNode.status = 'inactive'
                else break
            }
        }

        fields = draft
        return HttpResponse.json({
            status: 'saved',
            restartRequired: true,
            message: 'Configuration saved. Restart the application for changes to take effect.',
        })
    }),
]
