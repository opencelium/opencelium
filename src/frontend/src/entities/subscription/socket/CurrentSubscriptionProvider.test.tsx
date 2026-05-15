import {beforeEach, describe, expect, it, vi} from 'vitest'
import {act, render} from '@testing-library/react'
import type {Subscription} from '@entities/subscription/model/types'

vi.mock('@shared/api/socket/useSocket', () => ({
    useSocket: () => ({client: {}, status: 'connected', error: null}),
}))

let lastDestination = ''
let lastHandler: ((data: Subscription) => void) | null = null
vi.mock('@shared/api/socket/useStompSubscription', () => ({
    useStompSubscription: (
        _client: unknown,
        _isConnected: boolean,
        destination: string,
        onMessage: (data: Subscription) => void,
    ) => {
        lastDestination = destination
        lastHandler = onMessage
    },
}))

import {CurrentSubscriptionProvider} from './CurrentSubscriptionProvider'
import {useCurrentSubscription} from './useCurrentSubscription'

function Probe({onValue}: {onValue: (data: Subscription | null) => void}) {
    const {currentSubscription} = useCurrentSubscription()
    onValue(currentSubscription)
    return null
}

describe('CurrentSubscriptionProvider', () => {
    beforeEach(() => {
        lastDestination = ''
        lastHandler = null
    })

    it('subscribes to /subscription', () => {
        render(<CurrentSubscriptionProvider><Probe onValue={() => {}} /></CurrentSubscriptionProvider>)
        expect(lastDestination).toBe('/subscription')
    })

    it('starts with null and updates on incoming payload', () => {
        let received: Subscription | null = {} as Subscription
        render(
            <CurrentSubscriptionProvider>
                <Probe onValue={(v) => (received = v)} />
            </CurrentSubscriptionProvider>,
        )
        expect(received).toBeNull()

        const payload: Subscription = {
            subscriptionId: 7,
            name: 'Pro',
            status: 'ACTIVE',
            startDate: 1,
            endDate: 2,
        }
        act(() => lastHandler!(payload))
        expect(received).toEqual(payload)
    })
})
