import { afterEach, describe, expect, it } from 'vitest'
import {
    clearRequestOverrides,
    findRequestOverride,
    hasRequestOverrides,
    setRequestOverrideHandler,
    setRequestOverrides,
} from './requestOverrides'

describe('requestOverrides', () => {
    afterEach(() => clearRequestOverrides())

    it('answers a registered GET path', () => {
        setRequestOverrides({ '/connector/meta/all': [{ connectorId: -1 }] })
        expect(findRequestOverride('/connector/meta/all', 'GET')).toEqual([{ connectorId: -1 }])
    })

    it('treats a missing method as GET, which is how string args arrive', () => {
        setRequestOverrides({ '/invoker/all': [] })
        expect(findRequestOverride('/invoker/all')).toEqual([])
    })

    it('matches after the base URL has been resolved', () => {
        setRequestOverrides({ '/invoker/all': ['x'] })
        expect(findRequestOverride('https://api.example.com/invoker/all', 'GET')).toEqual(['x'])
    })

    it('lets everything else through', () => {
        setRequestOverrides({ '/invoker/all': [] })
        expect(findRequestOverride('/connector/all', 'GET')).toBeUndefined()
        // a query string is a different request, not a near-miss to guess at
        expect(findRequestOverride('/invoker/all?page=1', 'GET')).toBeUndefined()
    })

    it('never intercepts a write', () => {
        setRequestOverrides({ '/connector/all': [] })
        for (const method of ['POST', 'PUT', 'PATCH', 'DELETE', 'post']) {
            expect(findRequestOverride('/connector/all', method)).toBeUndefined()
        }
    })

    it('costs nothing and matches nothing when empty', () => {
        expect(hasRequestOverrides()).toBe(false)
        expect(findRequestOverride('/connector/all', 'GET')).toBeUndefined()
    })

    it('is fully removable', () => {
        setRequestOverrides({ '/invoker/all': [] })
        expect(hasRequestOverrides()).toBe(true)
        clearRequestOverrides()
        expect(hasRequestOverrides()).toBe(false)
        expect(findRequestOverride('/invoker/all', 'GET')).toBeUndefined()
    })

    describe('handler', () => {
        it('sees the stripped path, the upper-cased verb and the body', () => {
            const seen: unknown[] = []
            setRequestOverrideHandler(request => {
                seen.push(request)
                return { ok: true }
            })

            expect(findRequestOverride('https://api.example.com/scheduler', 'post', { title: 'x' }))
                .toEqual({ ok: true })
            expect(seen).toEqual([{ path: '/scheduler', method: 'POST', body: { title: 'x' } }])
        })

        it('declines by returning undefined, which lets the request through', () => {
            setRequestOverrideHandler(() => undefined)
            expect(findRequestOverride('/scheduler/42', 'DELETE')).toBeUndefined()
        })

        // The map is the cheaper answer and the one a test can pin, so it wins.
        it('is consulted only after the map has had its say', () => {
            setRequestOverrides({ '/invoker/all': ['mapped'] })
            setRequestOverrideHandler(() => ['handled'])
            expect(findRequestOverride('/invoker/all', 'GET')).toEqual(['mapped'])
            expect(findRequestOverride('/connector/all', 'GET')).toEqual(['handled'])
        })

        it('goes with the map, so one clear gives the real API back', () => {
            setRequestOverrideHandler(() => ({}))
            expect(hasRequestOverrides()).toBe(true)
            clearRequestOverrides()
            expect(hasRequestOverrides()).toBe(false)
            expect(findRequestOverride('/scheduler/all', 'GET')).toBeUndefined()
        })
    })
})
