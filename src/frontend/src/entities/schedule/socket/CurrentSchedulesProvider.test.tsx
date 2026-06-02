import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {act, render} from '@testing-library/react'
import type {CurrentSchedule} from '@entities/schedule/model/types'

vi.mock('@shared/api/socket/useSocket', () => ({
    useSocket: () => ({client: {}, status: 'connected', error: null}),
}))

let lastDestination = ''
let lastHandler: ((data: CurrentSchedule[]) => void) | null = null
vi.mock('@shared/api/socket/useStompSubscription', () => ({
    useStompSubscription: (
        _client: unknown,
        _isConnected: boolean,
        destination: string,
        onMessage: (data: CurrentSchedule[]) => void,
    ) => {
        lastDestination = destination
        lastHandler = onMessage
    },
}))

const unwrapMock = vi.fn()
const dispatchMock = vi.fn((action: unknown) => {
    if (action && typeof action === 'object' && '__getByIds' in action) {
        return {unwrap: () => unwrapMock()}
    }
    return undefined
})
vi.mock('@app/store/store', () => ({
    store: {dispatch: (...args: unknown[]) => dispatchMock(...args)},
}))

const initiateMock = vi.fn((ids: number[]) => ({__getByIds: ids}))
vi.mock('@entities/schedule/api/scheduleApi', () => ({
    scheduleApi: {
        endpoints: {
            getSchedulesByIds: {initiate: (ids: number[]) => initiateMock(ids)},
        },
    },
}))

const updateQueryDataMock = vi.fn(
    (endpoint: string, arg: unknown, recipe: unknown) => ({type: 'updateQueryData', endpoint, arg, recipe}),
)
vi.mock('@shared/api/genericApi', () => ({
    genericApi: {util: {updateQueryData: (endpoint: string, arg: unknown, recipe: unknown) => updateQueryDataMock(endpoint, arg, recipe)}},
}))

import {CurrentSchedulesProvider} from './CurrentSchedulesProvider'
import {useCurrentSchedules} from './useCurrentSchedules'
import type {ScheduleRunStatus} from './CurrentSchedulesContext'

function Probe({
    onValue,
    schedulerId,
}: {
    onValue: (data: CurrentSchedule[], status: ScheduleRunStatus, highlighted: boolean) => void
    schedulerId: number
}) {
    const {currentSchedules, getRunStatus, wasRecentlyUpdated} = useCurrentSchedules()
    onValue(currentSchedules, getRunStatus(schedulerId), wasRecentlyUpdated(schedulerId))
    return null
}

describe('CurrentSchedulesProvider', () => {
    beforeEach(() => {
        lastDestination = ''
        lastHandler = null
        dispatchMock.mockClear()
        initiateMock.mockClear()
        unwrapMock.mockReset()
        unwrapMock.mockResolvedValue([])
        updateQueryDataMock.mockClear()
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('subscribes to /scheduler/running/all', () => {
        render(
            <CurrentSchedulesProvider>
                <Probe schedulerId={1} onValue={() => {}} />
            </CurrentSchedulesProvider>,
        )
        expect(lastDestination).toBe('/scheduler/running/all')
    })

    it('exposes empty list and idle status before any message', () => {
        let received: CurrentSchedule[] = []
        let status: ScheduleRunStatus = {kind: 'idle'}
        render(
            <CurrentSchedulesProvider>
                <Probe
                    schedulerId={1}
                    onValue={(v, s) => {
                        received = v
                        status = s
                    }}
                />
            </CurrentSchedulesProvider>,
        )
        expect(received).toEqual([])
        expect(status).toEqual({kind: 'idle'})
    })

    it('transitions idle → running when schedule appears in payload', () => {
        let status: ScheduleRunStatus = {kind: 'idle'}
        render(
            <CurrentSchedulesProvider>
                <Probe schedulerId={1} onValue={(_v, s) => (status = s)} />
            </CurrentSchedulesProvider>,
        )
        const payload: CurrentSchedule[] = [{schedulerId: 1, title: 'A', avgDuration: 10000}]
        act(() => lastHandler!(payload))
        expect(status.kind).toBe('running')
        if (status.kind === 'running') {
            expect(status.avgDuration).toBe(10000)
            expect(typeof status.localStartTime).toBe('number')
        }
    })

    it('preserves localStartTime across subsequent messages for the same schedule', () => {
        let status: ScheduleRunStatus = {kind: 'idle'}
        render(
            <CurrentSchedulesProvider>
                <Probe schedulerId={1} onValue={(_v, s) => (status = s)} />
            </CurrentSchedulesProvider>,
        )
        act(() => lastHandler!([{schedulerId: 1, title: 'A', avgDuration: 10000}]))
        const firstSeen = status.kind === 'running' ? status.localStartTime : 0
        act(() => vi.advanceTimersByTime(1000))
        act(() => lastHandler!([{schedulerId: 1, title: 'A', avgDuration: 10000}]))
        expect(status.kind).toBe('running')
        if (status.kind === 'running') {
            expect(status.localStartTime).toBe(firstSeen)
        }
    })

    it('transitions running → just-finished when schedule disappears, then idle after 5s', () => {
        let status: ScheduleRunStatus = {kind: 'idle'}
        render(
            <CurrentSchedulesProvider>
                <Probe schedulerId={1} onValue={(_v, s) => (status = s)} />
            </CurrentSchedulesProvider>,
        )
        act(() => lastHandler!([{schedulerId: 1, title: 'A', avgDuration: 10000}]))
        act(() => vi.advanceTimersByTime(5000))
        act(() => lastHandler!([]))
        expect(status.kind).toBe('just-finished')
        if (status.kind === 'just-finished') {
            expect(status.lastProgressPercent).toBeGreaterThan(0)
            expect(status.lastProgressPercent).toBeLessThanOrEqual(95)
        }
        act(() => vi.advanceTimersByTime(5001))
        expect(status.kind).toBe('idle')
    })

    it('fetches the disappeared id by id and patches the list cache without invalidating', async () => {
        const refreshed = [{schedulerId: 1, title: 'A', lastExecution: {success: {startTime: 1, taId: 't'}}}]
        unwrapMock.mockResolvedValueOnce(refreshed)

        render(
            <CurrentSchedulesProvider>
                <Probe schedulerId={1} onValue={() => {}} />
            </CurrentSchedulesProvider>,
        )
        act(() => lastHandler!([{schedulerId: 1, title: 'A', avgDuration: 10000}]))
        expect(initiateMock).not.toHaveBeenCalled()

        act(() => lastHandler!([]))
        expect(initiateMock).toHaveBeenCalledWith([1])

        await act(async () => {
            await Promise.resolve()
        })
        expect(updateQueryDataMock).toHaveBeenCalledWith(
            'fetchEntities',
            '/scheduler/all',
            expect.any(Function),
        )
        expect(dispatchMock).toHaveBeenCalled()
    })

    it('flags refreshed schedules via wasRecentlyUpdated, then clears after the highlight window', async () => {
        const refreshed = [{schedulerId: 1, title: 'A', lastExecution: {success: {startTime: 1, taId: 't'}}}]
        unwrapMock.mockResolvedValueOnce(refreshed)
        let highlighted = false
        render(
            <CurrentSchedulesProvider>
                <Probe schedulerId={1} onValue={(_v, _s, h) => (highlighted = h)} />
            </CurrentSchedulesProvider>,
        )
        act(() => lastHandler!([{schedulerId: 1, title: 'A', avgDuration: 10000}]))
        expect(highlighted).toBe(false)
        act(() => lastHandler!([]))
        await act(async () => {
            await Promise.resolve()
        })
        expect(highlighted).toBe(true)
        act(() => vi.advanceTimersByTime(1801))
        expect(highlighted).toBe(false)
    })

    it('does not patch the cache when the refresh returns nothing', async () => {
        unwrapMock.mockResolvedValueOnce([])
        render(
            <CurrentSchedulesProvider>
                <Probe schedulerId={1} onValue={() => {}} />
            </CurrentSchedulesProvider>,
        )
        act(() => lastHandler!([{schedulerId: 1, title: 'A', avgDuration: 10000}]))
        act(() => lastHandler!([]))
        await act(async () => {
            await Promise.resolve()
        })
        expect(updateQueryDataMock).not.toHaveBeenCalled()
    })

    it('caps progress percent at 95 when elapsed exceeds avgDuration (100 is reserved for success)', () => {
        let status: ScheduleRunStatus = {kind: 'idle'}
        render(
            <CurrentSchedulesProvider>
                <Probe schedulerId={1} onValue={(_v, s) => (status = s)} />
            </CurrentSchedulesProvider>,
        )
        act(() => lastHandler!([{schedulerId: 1, title: 'A', avgDuration: 1000}]))
        act(() => vi.advanceTimersByTime(10_000))
        act(() => lastHandler!([]))
        expect(status.kind).toBe('just-finished')
        if (status.kind === 'just-finished') {
            expect(status.lastProgressPercent).toBe(95)
        }
    })

    it('returns running (not just-finished) if a schedule reappears within the 5s window', () => {
        let status: ScheduleRunStatus = {kind: 'idle'}
        render(
            <CurrentSchedulesProvider>
                <Probe schedulerId={1} onValue={(_v, s) => (status = s)} />
            </CurrentSchedulesProvider>,
        )
        act(() => lastHandler!([{schedulerId: 1, title: 'A', avgDuration: 10000}]))
        act(() => vi.advanceTimersByTime(1000))
        act(() => lastHandler!([]))
        expect(status.kind).toBe('just-finished')
        act(() => vi.advanceTimersByTime(1000))
        act(() => lastHandler!([{schedulerId: 1, title: 'A', avgDuration: 10000}]))
        expect(status.kind).toBe('running')
    })
})
