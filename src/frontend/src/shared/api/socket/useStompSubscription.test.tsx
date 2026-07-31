import {beforeEach, describe, expect, it, vi} from 'vitest'
import {renderHook} from '@testing-library/react'
import type {Client, IMessage} from '@stomp/stompjs'
import {useStompSubscription} from './useStompSubscription'

type FakeMessageHandler = (message: IMessage) => void

function createFakeClient() {
    const unsubscribe = vi.fn()
    const subscribe = vi.fn((_destination: string, _handler: FakeMessageHandler) => ({
        unsubscribe,
        id: 'sub-1',
    }))
    const client = {subscribe} as unknown as Client
    return {client, subscribe, unsubscribe}
}

function lastHandler(subscribe: ReturnType<typeof createFakeClient>['subscribe']): FakeMessageHandler {
    return subscribe.mock.calls.at(-1)![1] as FakeMessageHandler
}

describe('useStompSubscription', () => {
    beforeEach(() => {
        vi.spyOn(console, 'error').mockImplementation(() => {})
        vi.spyOn(console, 'debug').mockImplementation(() => {})
    })

    it('does not subscribe when client is null', () => {
        const onMessage = vi.fn()
        renderHook(() => useStompSubscription(null, true, '/foo', onMessage))
        expect(onMessage).not.toHaveBeenCalled()
    })

    it('does not subscribe when isConnected is false', () => {
        const {client, subscribe} = createFakeClient()
        renderHook(() => useStompSubscription(client, false, '/foo', () => {}))
        expect(subscribe).not.toHaveBeenCalled()
    })

    it('subscribes and parses JSON payloads', () => {
        const {client, subscribe} = createFakeClient()
        const onMessage = vi.fn()
        renderHook(() => useStompSubscription<{value: number}>(client, true, '/foo', onMessage))

        expect(subscribe).toHaveBeenCalledWith('/foo', expect.any(Function))
        lastHandler(subscribe)({body: '{"value":42}'} as IMessage)
        expect(onMessage).toHaveBeenCalledWith({value: 42})
    })

    it('swallows invalid JSON without crashing the subscription', () => {
        const {client, subscribe} = createFakeClient()
        const onMessage = vi.fn()
        renderHook(() => useStompSubscription(client, true, '/foo', onMessage))

        lastHandler(subscribe)({body: 'not json'} as IMessage)
        expect(onMessage).not.toHaveBeenCalled()
        expect(console.error).toHaveBeenCalled()
    })

    it('uses the latest onMessage handler without resubscribing', () => {
        const {client, subscribe} = createFakeClient()
        const first = vi.fn()
        const second = vi.fn()
        const {rerender} = renderHook(
            ({fn}: {fn: (data: unknown) => void}) =>
                useStompSubscription(client, true, '/foo', fn),
            {initialProps: {fn: first}},
        )
        expect(subscribe).toHaveBeenCalledTimes(1)

        rerender({fn: second})
        expect(subscribe).toHaveBeenCalledTimes(1)

        lastHandler(subscribe)({body: '{"x":1}'} as IMessage)
        expect(first).not.toHaveBeenCalled()
        expect(second).toHaveBeenCalledWith({x: 1})
    })

    it('unsubscribes on unmount', () => {
        const {client, unsubscribe} = createFakeClient()
        const {unmount} = renderHook(() => useStompSubscription(client, true, '/foo', () => {}))
        unmount()
        expect(unsubscribe).toHaveBeenCalledTimes(1)
    })

    it('unsubscribes and resubscribes when destination changes', () => {
        const {client, subscribe, unsubscribe} = createFakeClient()
        const {rerender} = renderHook(
            ({dest}: {dest: string}) => useStompSubscription(client, true, dest, () => {}),
            {initialProps: {dest: '/foo'}},
        )
        rerender({dest: '/bar'})

        expect(unsubscribe).toHaveBeenCalledTimes(1)
        expect(subscribe).toHaveBeenCalledTimes(2)
        expect(subscribe.mock.calls[1][0]).toBe('/bar')
    })
})
