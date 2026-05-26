import {http, HttpResponse} from 'msw'
import type {
    ApplicationConfigResponse,
    ConfigComment,
    ConfigData,
    ConfigValue,
} from '@entities/systemConfig/model/types'

const initialConfig: ConfigData = {
    server: {
        port: 9090,
        address: '127.0.0.1',
    },
    spring: {
        datasource: {
            url: 'jdbc:mariadb://localhost:3306/opencelium',
            username: 'root',
            password: 'root',
        },
    },
    opencelium: {
        version: 5.0,
        token: {
            secret: '84bbce-secret-value',
            'activity-time': 18000,
        },
        'debug-mode': false,
    },
    cors: {
        origins: ['http://localhost:3000'],
    },
}

const comments: ConfigComment[] = [
    {path: '$.header', position: 'before', text: ' Webserver configuration section'},
    {path: 'server.port', position: 'inline', text: ' default http port'},
    {path: 'spring.datasource', position: 'before', text: ' Database section'},
    {path: 'opencelium.token.activity-time', position: 'after', text: ' session lifetime in seconds'},
    {path: '$.footer', position: 'after', text: ' end of file'},
]

let current: ConfigData = structuredClone(initialConfig)

function isPlainObject(value: unknown): value is { [key: string]: ConfigValue } {
    return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function deepMerge(target: ConfigValue, patch: ConfigValue): ConfigValue {
    if (Array.isArray(patch)) return patch
    if (!isPlainObject(target) || !isPlainObject(patch)) return patch
    const out: { [key: string]: ConfigValue } = {...target}
    for (const key of Object.keys(patch)) {
        out[key] = deepMerge(target[key] ?? null, patch[key])
    }
    return out
}

export const systemConfigHandlers = [
    http.get('/application-config', () => {
        const body: ApplicationConfigResponse = {data: current, comments}
        return HttpResponse.json(body)
    }),

    http.patch('/application-config', async ({request}) => {
        const body = (await request.json()) as ConfigValue
        if (!isPlainObject(body)) {
            return HttpResponse.json(
                {
                    timestamp: new Date().toISOString(),
                    status: 400,
                    error: 'BAD_REQUEST',
                    message: 'Payload must be a JSON object',
                    path: '/application-config',
                },
                {status: 400},
            )
        }
        current = deepMerge(current, body) as ConfigData
        return HttpResponse.json({
            status: 'saved',
            restartRequired: true,
            message: 'Configuration saved. Restart the application for changes to take effect.',
        })
    }),
]
