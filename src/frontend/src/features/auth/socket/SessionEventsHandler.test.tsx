import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {render} from '@testing-library/react'

const dispatch = vi.fn()
vi.mock('@shared/lib/storeHooks', () => ({
    useAppDispatch: () => dispatch,
}))

const clearSession = vi.fn(() => ({type: 'auth/clearSession'}))
vi.mock('@entities/auth/model/authSlice', () => ({
    authActions: {clearSession: () => clearSession()},
}))

vi.mock('@shared/api/socket/useSocket', () => ({
    useSocket: () => ({client: {} as object, status: 'connected', error: null}),
}))

const capturedHandlers: Array<(data: unknown) => void> = []
vi.mock('@shared/api/socket/useStompSubscription', () => ({
    useStompSubscription: (
        _client: unknown,
        _isConnected: boolean,
        _destination: string,
        onMessage: (data: unknown) => void,
    ) => {
        capturedHandlers.push(onMessage)
    },
}))

class FakeBroadcastChannel {
    static instances: FakeBroadcastChannel[] = []
    static lastReceiver: FakeBroadcastChannel | null = null
    name: string
    onmessage: ((event: MessageEvent) => void) | null = null
    postMessage = vi.fn()
    close = vi.fn()

    constructor(name: string) {
        this.name = name
        FakeBroadcastChannel.instances.push(this)
        FakeBroadcastChannel.lastReceiver = this
    }
}

let originalBC: typeof BroadcastChannel | undefined

beforeEach(() => {
    capturedHandlers.length = 0
    dispatch.mockClear()
    clearSession.mockClear()
    FakeBroadcastChannel.instances = []
    FakeBroadcastChannel.lastReceiver = null
    originalBC = globalThis.BroadcastChannel
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    globalThis.BroadcastChannel = FakeBroadcastChannel as any
})

afterEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    globalThis.BroadcastChannel = originalBC as any
})

import {SessionEventsHandler} from './SessionEventsHandler'

describe('SessionEventsHandler', () => {
    it('renders nothing and opens a session-events broadcast channel', () => {
        const {container} = render(<SessionEventsHandler />)
        expect(container).toBeEmptyDOMElement()
        expect(FakeBroadcastChannel.instances).toHaveLength(1)
        expect(FakeBroadcastChannel.instances[0].name).toBe('session-events')
    })

    it('on FORCE_LOGOUT: dispatches clearSession and broadcasts LOGOUT', () => {
        render(<SessionEventsHandler />)
        const channel = FakeBroadcastChannel.instances[0]
        const stompHandler = capturedHandlers[0]

        stompHandler({event: 'FORCE_LOGOUT'})

        expect(clearSession).toHaveBeenCalledTimes(1)
        expect(dispatch).toHaveBeenCalledWith({type: 'auth/clearSession'})
        expect(channel.postMessage).toHaveBeenCalledWith({
            type: 'SESSION_UPDATE',
            payload: {action: 'LOGOUT'},
        })
    })

    it('ignores non-FORCE_LOGOUT events', () => {
        render(<SessionEventsHandler />)
        capturedHandlers[0]({event: 'SOMETHING_ELSE'})
        expect(dispatch).not.toHaveBeenCalled()
    })

    it('receives cross-tab LOGOUT broadcast and dispatches clearSession', () => {
        render(<SessionEventsHandler />)
        const channel = FakeBroadcastChannel.instances[0]
        channel.onmessage?.({data: {type: 'SESSION_UPDATE', payload: {action: 'LOGOUT'}}} as MessageEvent)
        expect(dispatch).toHaveBeenCalledWith({type: 'auth/clearSession'})
    })

    it('closes the channel on unmount', () => {
        const {unmount} = render(<SessionEventsHandler />)
        const channel = FakeBroadcastChannel.instances[0]
        unmount()
        expect(channel.close).toHaveBeenCalledTimes(1)
    })
})
