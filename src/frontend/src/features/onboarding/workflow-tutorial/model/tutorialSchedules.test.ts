import { afterEach, describe, expect, it } from 'vitest'
import type { Schedule, ScheduleWebhook } from '@entities/schedule/model/types'
import { OVERRIDE_UNAVAILABLE } from '@shared/api/requestOverrides'
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
        // a real, positive id is the server's business even while the tutorial runs
        expect(tutorialScheduleRequest({ path: '/scheduler/12', method: 'PUT' })).toBeUndefined()
        expect(tutorialScheduleRequest({ path: '/webhook/url/3/12', method: 'GET' })).toBeUndefined()
    })

    // The debug switch and the cron editor both PUT the whole schedule back.
    it('updates a schedule in place, so the switch and the cron edit stick', () => {
        const created = add({ title: 'x', cronExp: '0 0 * * * ?', debugMode: false })
        const path = `/scheduler/${created.schedulerId}`

        tutorialScheduleRequest({ path, method: 'PUT',
            body: { ...created, cronExp: '0 30 2 * * ?', debugMode: true } })

        expect(tutorialScheduleRequest({ path, method: 'GET' })).toMatchObject({
            schedulerId: created.schedulerId, cronExp: '0 30 2 * * ?', debugMode: true })
        expect(list()[0].debugMode).toBe(true)
    })

    // What came back from a GET is frozen in the RTK Query cache; a write must not touch it.
    it('replaces rather than mutates what it already returned', () => {
        const created = Object.freeze(add({ title: 'x', debugMode: false }))
        expect(() => tutorialScheduleRequest({ path: `/scheduler/${created.schedulerId}`,
            method: 'PUT', body: { debugMode: true } })).not.toThrow()
        expect(created.debugMode).toBe(false)
    })

    it('creates and deletes a webhook on the schedule', () => {
        const created = add({ title: 'x' })
        const webhook = tutorialScheduleRequest({
            path: `/webhook/url/7/${created.schedulerId}`, method: 'GET' }) as ScheduleWebhook

        expect(webhook.webhookId).toBeLessThan(0)
        expect(webhook.url).toMatch(/^\.\/webhook\//)
        expect(list()[0].webhook).toEqual(webhook)

        tutorialScheduleRequest({ path: `/webhook/${webhook.webhookId}`, method: 'DELETE' })
        expect(list()[0].webhook).toBeUndefined()
    })

    it('opens the notifications dialog on an empty list', () => {
        const created = add({ title: 'x' })
        expect(tutorialScheduleRequest({
            path: `/scheduler/${created.schedulerId}/notification/all`, method: 'GET' })).toEqual([])
    })

    // The backend cannot know a tutorial id, so letting these through only gets a 404.
    it('fails locally what it cannot fake but owns the id of', () => {
        const created = add({ title: 'x' })
        expect(tutorialScheduleRequest({ path: `/scheduler/${created.schedulerId}/notification`,
            method: 'POST', body: {} })).toBe(OVERRIDE_UNAVAILABLE)
        expect(tutorialScheduleRequest({
            path: `/connection/execute/${TUTORIAL_CONNECTION_ID}/support-file`, method: 'POST',
        })).toBe(OVERRIDE_UNAVAILABLE)
    })

    it('forgets everything on reset, so a second run opens on an empty panel', () => {
        add({ title: 'x' })
        resetTutorialSchedules()
        expect(list()).toEqual([])
    })
})
