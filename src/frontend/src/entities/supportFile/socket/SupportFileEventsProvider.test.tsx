import {beforeEach, describe, expect, it, vi} from 'vitest'
import {act, render} from '@testing-library/react'

vi.mock('@shared/api/socket/useSocket', () => ({
    useSocket: () => ({client: {}, status: 'connected', error: null}),
}))

let lastDestination = ''
let lastHandler: ((data: unknown) => void) | null = null
vi.mock('@shared/api/socket/useStompSubscription', () => ({
    useStompSubscription: (
        _client: unknown,
        _isConnected: boolean,
        destination: string,
        onMessage: (data: unknown) => void,
    ) => {
        lastDestination = destination
        lastHandler = onMessage
    },
}))

import {SupportFileEventsProvider} from './SupportFileEventsProvider'
import {useSupportFileEvents} from './useSupportFileEvents'

type Snapshot = {hasNewSupportFile: boolean; clear: () => void}

function Probe({onValue}: {onValue: (snap: Snapshot) => void}) {
    const value = useSupportFileEvents()
    onValue(value)
    return null
}

describe('SupportFileEventsProvider', () => {
    beforeEach(() => {
        lastDestination = ''
        lastHandler = null
    })

    it('subscribes to /execution/support-file', () => {
        render(<SupportFileEventsProvider><Probe onValue={() => {}} /></SupportFileEventsProvider>)
        expect(lastDestination).toBe('/execution/support-file')
    })

    it('flips hasNewSupportFile on incoming event and clears on demand', () => {
        let snap: Snapshot = {hasNewSupportFile: true, clear: () => {}}
        render(
            <SupportFileEventsProvider>
                <Probe onValue={(s) => (snap = s)} />
            </SupportFileEventsProvider>,
        )
        expect(snap.hasNewSupportFile).toBe(false)

        act(() => lastHandler!({any: 'payload'}))
        expect(snap.hasNewSupportFile).toBe(true)

        act(() => snap.clear())
        expect(snap.hasNewSupportFile).toBe(false)
    })
})
