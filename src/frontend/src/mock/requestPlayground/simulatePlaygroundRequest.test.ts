import { describe, expect, it } from 'vitest'
import type { PlaygroundRequest } from '@features/workflow/request-playground/model/playground.types'
import { defaultSettings } from '@features/workflow/request-playground/model/playgroundSettings'
import { simulatePlaygroundRequest } from './simulatePlaygroundRequest'

const request = (endpoint: string, fields: unknown, patch: Partial<PlaygroundRequest> = {}): PlaygroundRequest => ({
    connectionId: 1,
    connectorId: 2,
    method: { color: '#bbbbbb', request: { endpoint, method: 'POST', header: {}, body: { fields } } } as unknown as PlaygroundRequest['method'],
    fieldBindings: [],
    references: [{ reference: '#aaaaaa.(response).body.$.id', value: 7, isOverridden: false }],
    webhooks: [{ name: 'tag', value: 'x' }],
    requestData: {},
    runUpstream: false,
    settings: defaultSettings(undefined),
    ...patch,
})

describe('simulatePlaygroundRequest', () => {
    it('substitutes inline and whole-field references, keeping the value type for whole fields', () => {
        const result = simulatePlaygroundRequest(request('/users/{%#aaaaaa.(response).body.$.id%}', {
            id: '#aaaaaa.(response).body.$.id',
            label: 'user-#aaaaaa.(response).body.$.id-${tag:string}',
        }))
        expect(result.kind).toBe('success')
        expect(result.request).toMatchObject({ url: '/users/7', body: { id: 7, label: 'user-7-x' } })
        expect(result.kind === 'success' && result.timings).toBeTruthy()
    })

    it('fails at the resolve stage when the URL keeps an unresolved reference', () => {
        const result = simulatePlaygroundRequest(request('/users/{%#cccccc.(response).body.$.id%}', {}))
        expect(result).toMatchObject({ kind: 'error', stage: 'resolve' })
    })

    it('answers open references itself when the upstream steps run first', () => {
        const result = simulatePlaygroundRequest(request('/users/{%#cccccc.(response).body.$.id%}', { empty: '' },
            { runUpstream: true, references: [] }))
        expect(result.request).toMatchObject({ url: '/users/upstream-value', body: { empty: '' } })
    })

    it('fills connection placeholders from the request data overrides', () => {
        const result = simulatePlaygroundRequest(request('{url}/x', {}, { requestData: { url: 'https://staging' } }))
        expect(result.request?.url).toBe('https://staging/x')
    })
})
