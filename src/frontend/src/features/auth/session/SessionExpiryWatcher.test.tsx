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

let isAuthenticated = true
vi.mock('@features/auth/useAuth', () => ({
    useAuth: () => ({isAuthenticated}),
}))

let expired = false
vi.mock('@features/auth/session/sessionTiming', () => ({
    isSessionExpired: () => expired,
    recordActivity: vi.fn(),
}))

class FakeBroadcastChannel {
    static instances: FakeBroadcastChannel[] = []
    name: string
    postMessage = vi.fn()
    close = vi.fn()

    constructor(name: string) {
        this.name = name
        FakeBroadcastChannel.instances.push(this)
    }
}

let originalBC: typeof BroadcastChannel | undefined

beforeEach(() => {
    dispatch.mockClear()
    clearSession.mockClear()
    isAuthenticated = true
    expired = false
    FakeBroadcastChannel.instances = []
    originalBC = globalThis.BroadcastChannel
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    globalThis.BroadcastChannel = FakeBroadcastChannel as any
    vi.useFakeTimers()
})

afterEach(() => {
    vi.useRealTimers()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    globalThis.BroadcastChannel = originalBC as any
})

import {SessionExpiryWatcher} from './SessionExpiryWatcher'

describe('SessionExpiryWatcher', () => {
    it('renders nothing', () => {
        const {container} = render(<SessionExpiryWatcher />)
        expect(container).toBeEmptyDOMElement()
    })

    it('does nothing while unauthenticated', () => {
        isAuthenticated = false
        expired = true
        render(<SessionExpiryWatcher />)
        expect(dispatch).not.toHaveBeenCalled()
    })

    it('checks immediately on mount and logs out (+broadcasts) if already expired', () => {
        expired = true
        render(<SessionExpiryWatcher />)
        expect(clearSession).toHaveBeenCalledTimes(1)
        expect(dispatch).toHaveBeenCalledWith({type: 'auth/clearSession'})
        expect(FakeBroadcastChannel.instances).toHaveLength(1)
        expect(FakeBroadcastChannel.instances[0].postMessage).toHaveBeenCalledWith({
            type: 'SESSION_UPDATE',
            payload: {action: 'LOGOUT'},
        })
    })

    it('does not log out while still within both windows', () => {
        expired = false
        render(<SessionExpiryWatcher />)
        vi.advanceTimersByTime(15_000)
        expect(dispatch).not.toHaveBeenCalled()
    })

    it('logs out once the periodic check detects expiry', () => {
        render(<SessionExpiryWatcher />)
        expect(dispatch).not.toHaveBeenCalled()
        expired = true
        vi.advanceTimersByTime(15_000)
        expect(dispatch).toHaveBeenCalledWith({type: 'auth/clearSession'})
    })

    it('stops checking after unmount', () => {
        const {unmount} = render(<SessionExpiryWatcher />)
        unmount()
        expired = true
        vi.advanceTimersByTime(60_000)
        expect(dispatch).not.toHaveBeenCalled()
    })
})
