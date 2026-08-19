import { beforeEach, describe, expect, it, vi } from 'vitest'

const notificationError = vi.fn()
vi.mock('antd', () => ({
    notification: { error: (args: unknown) => notificationError(args) },
}))

vi.mock('@shared/i18n/config/i18n.ts', () => ({
    i18n: {
        language: 'en',
        getFixedT: (_lng: string, ns: string) => (key: string, opts?: { defaultValue?: string }) => {
            if (ns === 'error' && key === 'title') return 'Error'
            if (key === 'api.notFound') return 'The requested resource was not found.'
            if (key === 'api.default') return 'An unexpected error occurred.'
            return opts?.defaultValue ?? ''
        },
        exists: (key: string) => key === 'api.default',
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

    it('still reports an unknown error group', () => {
        showApiError({ errorSource: null, group: 'nope' as 'api', transKey: 'x' })

        expect(lastCall().description).toBe('Unknown error group')
    })
})
