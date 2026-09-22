import { afterEach, describe, expect, it } from 'vitest'
import type { Schedule } from '@entities/schedule/model/types'
import {
    resetTutorialSchedules,
    TUTORIAL_CONNECTION_ID,
    tutorialScheduleRequest,
} from './tutorialSchedules'

const list = () =>
    tutorialScheduleRequest({ path: '/scheduler/all', method: 'GET' }) as Schedule[]

const add = (body: unknown) =>
    tutorialScheduleRequest({ path: '/scheduler', method: 'POST', body }) as Schedule

describe('tutorial schedules', () => {
    afterEach(() => resetTutorialSchedules())

    it('starts empty, so the panel teaches its own empty state', () => {
        expect(list()).toEqual([])
    })

    it('creates a schedule the panel can render, and lists it back', () => {
        const created = add({ title: 'Nightly', cronExp: '0 0 2 * * ?', debugMode: true,
            connectionId: String(TUTORIAL_CONNECTION_ID) })

        expect(created.title).toBe('Nightly')
        expect(created.cronExp).toBe('0 0 2 * * ?')
        expect(created.debugMode).toBe(true)
        expect(created.connection.connectionId).toBe(TUTORIAL_CONNECTION_ID)
        expect(list()).toEqual([created])
    })

    // Negative, like the invented connectors: a request that escapes to the real
    // backend should be obvious rather than touch someone's data.
    it('gives every schedule a distinct negative id', () => {
        const first = add({ title: 'a' })
        const second = add({ title: 'b' })

        expect(first.schedulerId).toBeLessThan(0)
        expect(second.schedulerId).toBeLessThan(first.schedulerId)
    })

    it('deletes by id, so a card the user removes actually goes', () => {
        const kept = add({ title: 'keep' })
        const dropped = add({ title: 'drop' })

        tutorialScheduleRequest({ path: `/scheduler/${dropped.schedulerId}`, method: 'DELETE' })

        expect(list()).toEqual([kept])
    })

    // The play button on a card's status ring. Answered rather than declined: the run
    // it would start belongs to a connection that exists nowhere.
    it('answers a manual trigger instead of letting it reach the backend', () => {
        const created = add({ title: 'x' })
        expect(tutorialScheduleRequest({
            path: `/scheduler/execute/${created.schedulerId}`, method: 'GET',
        })).toEqual({})
    })

    it('declines everything else, so the rest of the app still talks to the server', () => {
        expect(tutorialScheduleRequest({ path: '/connection/all', method: 'GET' })).toBeUndefined()
        expect(tutorialScheduleRequest({ path: '/scheduler/all', method: 'DELETE' })).toBeUndefined()
        expect(tutorialScheduleRequest({ path: '/scheduler', method: 'GET' })).toBeUndefined()
        // an update is not part of what the tutorial teaches, so it is not faked either
        expect(tutorialScheduleRequest({ path: '/scheduler/-8001', method: 'PUT' })).toBeUndefined()
    })

    it('forgets everything on reset, so a second run opens on an empty panel', () => {
        add({ title: 'x' })
        resetTutorialSchedules()
        expect(list()).toEqual([])
    })
})
