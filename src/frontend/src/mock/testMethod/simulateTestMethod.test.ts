import { describe, expect, it } from 'vitest'
import type { TestMethodRequest } from '@features/workflow/test-method/testMethod.types'
import { simulateTestMethod } from './simulateTestMethod'

const request = (endpoint: string, fields: unknown): TestMethodRequest => ({
    connectionId: 1,
    method: { color: '#bbbbbb', request: { endpoint, method: 'POST', header: {}, body: { fields } } } as unknown as TestMethodRequest['method'],
    fieldBindings: [],
    references: [{ reference: '#aaaaaa.(response).body.$.id', value: 7 }],
    webhooks: [{ name: 'tag', value: 'x' }],
})

describe('simulateTestMethod', () => {
    it('substitutes inline and whole-field references, keeping the value type for whole fields', () => {
        const result = simulateTestMethod(request('/users/{%#aaaaaa.(response).body.$.id%}', {
            id: '#aaaaaa.(response).body.$.id',
            label: 'user-#aaaaaa.(response).body.$.id-${tag:string}',
        }))
        expect(result.kind).toBe('success')
        expect(result.request).toMatchObject({ url: '/users/7', body: { id: 7, label: 'user-7-x' } })
    })

    it('reports a url reference without a value as a resolve error', () => {
        const result = simulateTestMethod(request('/users/{%#cccccc.(response).body.$.id%}', {}))
        expect(result).toMatchObject({ kind: 'error', stage: 'resolve' })
    })
})
