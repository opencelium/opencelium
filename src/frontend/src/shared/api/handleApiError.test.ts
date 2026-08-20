import { beforeEach, describe, expect, it, vi } from 'vitest'

const notificationError = vi.fn()
vi.mock('antd', () => ({
    notification: { error: (args: unknown) => notificationError(args) },
}))

vi.mock('@shared/i18n/config/i18n', () => ({
    i18n: {
        language: 'en',
        getFixedT: (_lng: string, ns: string) =>
            (key: string, opts?: { defaultValue?: string; resource?: string }) => {
                if (ns === 'error' && key === 'title') return 'Error'
                if (key === 'api.notFound') return 'The requested resource was not found.'
                if (key === 'api.default') return 'An unexpected error occurred.'
                if (key === 'api.CATEGORY_NOT_FOUND') return 'This category was not found.'
                if (key === 'api.operation.load') return `Could not load ${opts?.resource}`
                if (key === 'api.operation.delete') return `Could not delete ${opts?.resource}`
                if (ns === 'entities' && key === 'connector.list.title') return 'Connectors'
                return opts?.defaultValue ?? ''
            },
        exists: (key: string) => key === 'api.default' || key === 'api.notFound'
            || key === 'api.CATEGORY_NOT_FOUND' || key === 'connector.list.title',
    },
}))

import { showApiError } from './handleApiError'

const lastCall = () => notificationError.mock.calls.at(-1)?.[0] as {
    message: string
    description: string
    duration: number
}

beforeEach(() => {
    notificationError.mockClear()
})

describe('showApiError', () => {
    it('shows a dismiss-only notification by default', () => {
        showApiError({ errorSource: null, group: 'api', transKey: 'notFound' })

        expect(lastCall()).toEqual({
            message: 'Error',
            description: 'The requested resource was not found.',
            // 0 is antd's "never auto-close": the close icon is the only way out.
            duration: 0,
        })
    })

    it('honours an explicit lifetime when a caller wants one', () => {
        showApiError({ errorSource: null, group: 'api', transKey: 'notFound', durationSec: 12 })

        expect(lastCall().duration).toBe(12)
    })

    it('falls back to the namespace default message', () => {
        showApiError({ errorSource: null, group: 'api', transKey: 'somethingUnmapped' })

        expect(lastCall().description).toBe('An unexpected error occurred.')
        expect(lastCall().duration).toBe(0)
    })

    it('shows what the API replied instead of generic per-status copy', () => {
        showApiError({
            errorSource: null, group: 'api', transKey: 'validation',
            message: 'Connector name must be unique',
        })

        expect(lastCall().description).toBe('Connector name must be unique')
    })

    it('prefers copy written for a backend code over echoing the bare code', () => {
        showApiError({
            errorSource: null, group: 'api', transKey: 'CATEGORY_NOT_FOUND',
            message: 'CATEGORY_NOT_FOUND',
        })

        expect(lastCall().description).toBe('This category was not found.')
    })

    it('shows the API message when no copy exists for it at all', () => {
        showApiError({ errorSource: null, namespace: 'error', transKey: 'no.copy.at.all',
            message: 'Operator (index=1, type=loop) has null or empty expression' })

        expect(lastCall().description)
            .toBe('Operator (index=1, type=loop) has null or empty expression')
    })

    it('keeps translated copy when the response explained nothing', () => {
        showApiError({ errorSource: null, group: 'api', transKey: 'notFound' })

        expect(lastCall().description).toBe('The requested resource was not found.')
    })

    it('leads with the operation that failed and keeps the reason underneath', () => {
        showApiError({
            errorSource: null, group: 'api', transKey: 'validation',
            message: 'Connector name must be unique',
            request: { method: 'GET', url: '/connector/all?page=1' },
        })

        expect(lastCall().message).toBe('Could not load Connectors')
        expect(lastCall().description).toBe('Connector name must be unique')
    })

    it('names a path with no entity behind it by its own segment', () => {
        showApiError({
            errorSource: null, group: 'api', transKey: 'validation',
            message: 'Master password is not set',
            request: { method: 'DELETE', url: '/config/master-password' },
        })

        expect(lastCall().message).toBe('Could not delete config')
    })

    it('keeps the generic heading when no request is known', () => {
        showApiError({ errorSource: null, group: 'api', transKey: 'notFound' })

        expect(lastCall().message).toBe('Error')
    })

    it('still reports an unknown error group', () => {
        showApiError({ errorSource: null, group: 'nope' as 'api', transKey: 'x' })

        expect(lastCall().description).toBe('Unknown error group')
    })
})
