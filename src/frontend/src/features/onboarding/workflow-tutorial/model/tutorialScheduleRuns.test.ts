import { afterEach, describe, expect, it } from 'vitest'
import type { Schedule } from '@entities/schedule/model/types'
import type { FlowchartLog } from '@features/logs'
import { clearRequestOverrides } from '@shared/api/requestOverrides'
import { resetTutorialSchedules, tutorialScheduleRequest } from './tutorialSchedules'
import { createTutorialTestRun, resetLastTutorialRunScript } from './tutorialTestRun'

const get = (path: string) => tutorialScheduleRequest({ path, method: 'GET' })
const list = () => get('/scheduler/all') as Schedule[]
const add = (debugMode: boolean) =>
    tutorialScheduleRequest({ path: '/scheduler', method: 'POST', body: { title: 'x', debugMode } }) as Schedule

const PAYLOAD = { fromConnector: { operators: [], methods: [
    { index: '0', id: 'm0', name: 'getCustomers', request: { endpoint: '/customers', method: 'GET' } },
] } }
const testRun = () => createTutorialTestRun(PAYLOAD)

const logFiles = (schedule: Schedule, status: 's' | 'f' = 's') => (get(
    `/execution/log-files?connectionId=${schedule.connection.connectionId}&schedulerId=${schedule.schedulerId}&status=${status}`,
) as { result: string[] }).result

describe('tutorial schedule runs', () => {
    afterEach(() => {
        resetTutorialSchedules()
        resetLastTutorialRunScript()
        clearRequestOverrides()
    })

    it('gives a started schedule a last success', () => {
        testRun()
        const schedule = add(false)
        get(`/scheduler/execute/${schedule.schedulerId}`)

        const success = list()[0].lastExecution?.success
        expect(success?.startTime).toBeGreaterThan(0)
        expect(success?.duration).toBe(184)
        // Not in debug mode, so the server would have kept no log.
        expect(success?.hasLog).toBe(false)
        expect(logFiles(schedule)).toEqual([])
    })

    it('stores the logs of a debug-mode run and answers the logs dialog with them', () => {
        testRun()
        const schedule = add(true)
        get(`/scheduler/execute/${schedule.schedulerId}`)

        expect(list()[0].lastExecution?.success?.hasLog).toBe(true)
        const [file] = logFiles(schedule)
        expect(file).toMatch(/^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}_-9000_s_-\d+\.log$/)
        expect(logFiles(schedule, 'f')).toEqual([])

        const executionId = file.replace(/\.log$/, '').split('_')[4]
        const [connector] = get(`/execution/log/element/${executionId}/children`) as FlowchartLog[]
        expect(connector.type).toBe('FLOWCHART')

        const rows = get(`/execution/log/element/${connector.id}/children`) as { id: string }[]
        expect(rows).toHaveLength(1)
        expect(get(`/execution/log/element/${rows[0].id}/details`)).toMatchObject({ type: 'OPERATION' })
        expect(get(`/execution/${executionId}/raw/log`)).toBeInstanceOf(Blob)
    })

    // A `?tutorialStep=` link can skip the test run; the sample graph stands in for it.
    it('replays the sample graph when there was no test run', () => {
        const schedule = add(true)
        get(`/scheduler/execute/${schedule.schedulerId}`)

        expect(list()[0].lastExecution?.success?.hasLog).toBe(true)
        const executionId = logFiles(schedule)[0].replace(/\.log$/, '').split('_')[4]
        const [connector] = get(`/execution/log/element/${executionId}/children`) as FlowchartLog[]
        expect((get(`/execution/log/element/${connector.id}/children`) as unknown[]).length).toBeGreaterThan(0)
    })
})
