import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {act, render} from '@testing-library/react'
import type {CurrentExecution} from '@entities/schedule/model/types'

vi.mock('@shared/api/socket/useSocket', () => ({
    useSocket: () => ({client: {}, status: 'connected', error: null}),
}))

let lastDestination = ''
let lastHandler: ((data: CurrentExecution[]) => void) | null = null
vi.mock('@shared/api/socket/useStompSubscription', () => ({
    useStompSubscription: (
        _client: unknown,
        _isConnected: boolean,
        destination: string,
        onMessage: (data: CurrentExecution[]) => void,
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
import type {RunningExecution} from './CurrentSchedulesContext'

function exec(overrides: Partial<CurrentExecution> & {execId: number; schedulerId: number}): CurrentExecution {
    return {
        connectionId: 1,
        title: 'A',
        startTime: '2026-06-26T09:38:25.000+00:00',
        avgDuration: 10000,
        fromConnector: null,
        toConnector: null,
        ...overrides,
    }
}

function Probe({
    onValue,
    schedulerId,
}: {
    onValue: (running: RunningExecution[], highlighted: boolean) => void
    schedulerId: number
}) {
    const {getRunningExecutions, wasRecentlyUpdated} = useCurrentSchedules()
    onValue(getRunningExecutions(schedulerId), wasRecentlyUpdated(schedulerId))
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

    it('exposes no running executions before any message', () => {
        let running: RunningExecution[] = [{} as RunningExecution]
        render(
            <CurrentSchedulesProvider>
                <Probe schedulerId={1} onValue={(r) => (running = r)} />
            </CurrentSchedulesProvider>,
        )
        expect(running).toEqual([])
    })

    it('exposes a running execution when one appears, parsing the server start time', () => {
        let running: RunningExecution[] = []
        render(
            <CurrentSchedulesProvider>
                <Probe schedulerId={1} onValue={(r) => (running = r)} />
            </CurrentSchedulesProvider>,
        )
        act(() => lastHandler!([exec({execId: 26, schedulerId: 1, avgDuration: 10000})]))
        expect(running).toHaveLength(1)
        expect(running[0].execId).toBe(26)
        expect(running[0].avgDuration).toBe(10000)
        expect(running[0].serverStartTime).toBe(Date.parse('2026-06-26T09:38:25.000+00:00'))
    })

    it('groups multiple parallel executions under the same schedule, sorted by start time', () => {
        let running: RunningExecution[] = []
        render(
            <CurrentSchedulesProvider>
                <Probe schedulerId={1} onValue={(r) => (running = r)} />
            </CurrentSchedulesProvider>,
        )
        act(() =>
            lastHandler!([
                exec({execId: 27, schedulerId: 1, startTime: '2026-06-26T09:38:35.000+00:00'}),
                exec({execId: 26, schedulerId: 1, startTime: '2026-06-26T09:38:25.000+00:00'}),
                exec({execId: 99, schedulerId: 2}),
            ]),
        )
        expect(running.map((r) => r.execId)).toEqual([26, 27])
    })

    it('keeps serverStartTime stable per execId across subsequent heartbeats', () => {
        let running: RunningExecution[] = []
        render(
            <CurrentSchedulesProvider>
                <Probe schedulerId={1} onValue={(r) => (running = r)} />
            </CurrentSchedulesProvider>,
        )
        act(() => lastHandler!([exec({execId: 26, schedulerId: 1})]))
        const firstSeen = running[0].serverStartTime
        act(() => vi.advanceTimersByTime(1000))
        act(() => lastHandler!([exec({execId: 26, schedulerId: 1})]))
        expect(running[0].serverStartTime).toBe(firstSeen)
    })

    it('drops an execution from the group when its execId disappears', () => {
        let running: RunningExecution[] = []
        render(
            <CurrentSchedulesProvider>
                <Probe schedulerId={1} onValue={(r) => (running = r)} />
            </CurrentSchedulesProvider>,
        )
        act(() =>
            lastHandler!([
                exec({execId: 26, schedulerId: 1}),
                exec({execId: 27, schedulerId: 1}),
            ]),
        )
        act(() => lastHandler!([exec({execId: 27, schedulerId: 1})]))
        expect(running.map((r) => r.execId)).toEqual([27])
    })

    it('refetches the schedule by id and patches the list cache when an execution finishes', async () => {
        const refreshed = [{schedulerId: 1, title: 'A', lastExecution: {success: {startTime: 1, taId: 't'}}}]
        unwrapMock.mockResolvedValueOnce(refreshed)

        render(
            <CurrentSchedulesProvider>
                <Probe schedulerId={1} onValue={() => {}} />
            </CurrentSchedulesProvider>,
        )
        act(() => lastHandler!([exec({execId: 26, schedulerId: 1})]))
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

    it('flags the refreshed schedule via wasRecentlyUpdated, then clears it after the highlight window', async () => {
        const refreshed = [{schedulerId: 1, title: 'A', lastExecution: {success: {startTime: 1, taId: 't'}}}]
        unwrapMock.mockResolvedValueOnce(refreshed)
        let highlighted = false
        render(
            <CurrentSchedulesProvider>
                <Probe schedulerId={1} onValue={(_r, h) => (highlighted = h)} />
            </CurrentSchedulesProvider>,
        )
        act(() => lastHandler!([exec({execId: 26, schedulerId: 1})]))
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
        act(() => lastHandler!([exec({execId: 26, schedulerId: 1})]))
        act(() => lastHandler!([]))
        await act(async () => {
            await Promise.resolve()
        })
        expect(updateQueryDataMock).not.toHaveBeenCalled()
    })

    it('keeps the schedule running if another of its executions is still active', () => {
        render(
            <CurrentSchedulesProvider>
                <Probe schedulerId={1} onValue={() => {}} />
            </CurrentSchedulesProvider>,
        )
        act(() =>
            lastHandler!([
                exec({execId: 26, schedulerId: 1}),
                exec({execId: 27, schedulerId: 1}),
            ]),
        )
        // One finishes, one stays — the schedule still has a running execution, but
        // a finish still triggers a refetch so the last-execution columns refresh.
        act(() => lastHandler!([exec({execId: 27, schedulerId: 1})]))
        expect(initiateMock).toHaveBeenCalledWith([1])
    })
})
