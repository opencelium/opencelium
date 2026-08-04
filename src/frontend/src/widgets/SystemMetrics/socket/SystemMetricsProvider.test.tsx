import {beforeEach, describe, expect, it, vi} from 'vitest'
import {act, render} from '@testing-library/react'
import type {Metrics} from '@widgets/SystemMetrics/model/types'

vi.mock('@shared/api/socket/useSocket', () => ({
    useSocket: () => ({client: {}, status: 'connected', error: null}),
}))

let lastDestination = ''
let lastHandler: ((data: Metrics) => void) | null = null
vi.mock('@shared/api/socket/useStompSubscription', () => ({
    useStompSubscription: (
        _client: unknown,
        _isConnected: boolean,
        destination: string,
        onMessage: (data: Metrics) => void,
    ) => {
        lastDestination = destination
        lastHandler = onMessage
    },
}))

import {SystemMetricsProvider} from './SystemMetricsProvider'
import {useSystemMetrics} from './useSystemMetrics'

function Probe({onValue}: {onValue: (data: Metrics | null) => void}) {
    const {systemMetrics} = useSystemMetrics()
    onValue(systemMetrics)
    return null
}

describe('SystemMetricsProvider', () => {
    beforeEach(() => {
        lastDestination = ''
        lastHandler = null
    })

    it('subscribes to /subscription/system/metrics', () => {
        render(<SystemMetricsProvider><Probe onValue={() => {}} /></SystemMetricsProvider>)
        expect(lastDestination).toBe('/subscription/system/metrics')
    })

    it('exposes updated metrics on incoming payload', () => {
        let received: Metrics | null = {cpu: 99}
        render(
            <SystemMetricsProvider>
                <Probe onValue={(v) => (received = v)} />
            </SystemMetricsProvider>,
        )
        expect(received).toBeNull()

        const payload: Metrics = {cpu: 42, memory: 17, timestamp: 1234}
        act(() => lastHandler!(payload))
        expect(received).toEqual(payload)
    })
})
