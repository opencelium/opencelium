import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
    SESSION_ACTIVITY_TIMEOUT_SEC,
    SESSION_EXPIRATION_SEC,
    clearSessionTiming,
    isSessionExpired,
    markSessionStarted,
    recordActivity,
} from './sessionTiming'

describe('sessionTiming', () => {
    beforeEach(() => {
        localStorage.clear()
    })

    afterEach(() => {
        localStorage.clear()
    })

    it('is not expired with no timing recorded (pre-upgrade / already-cleared session)', () => {
        expect(isSessionExpired()).toBe(false)
    })

    it('is not expired right after a session starts', () => {
        const now = 1_000_000
        markSessionStarted(now)
        expect(isSessionExpired(now)).toBe(false)
    })

    it('expires after the idle window elapses with no activity', () => {
        const start = 1_000_000
        markSessionStarted(start)
        const idleExpired = start + SESSION_ACTIVITY_TIMEOUT_SEC * 1000 + 1
        expect(isSessionExpired(idleExpired)).toBe(true)
    })

    it('recordActivity resets the idle window', () => {
        const start = 1_000_000
        markSessionStarted(start)
        const almostIdle = start + SESSION_ACTIVITY_TIMEOUT_SEC * 1000 - 1
        recordActivity(almostIdle)
        const stillWithinIdleOfActivity = almostIdle + 1000
        expect(isSessionExpired(stillWithinIdleOfActivity)).toBe(false)
    })

    it('expires after the absolute session cap even with continuous activity', () => {
        const start = 1_000_000
        markSessionStarted(start)
        const beyondCap = start + SESSION_EXPIRATION_SEC * 1000 + 1
        // Activity right up until the cap — idle window alone would not expire it.
        recordActivity(beyondCap - 1)
        expect(isSessionExpired(beyondCap)).toBe(true)
    })

    it('recordActivity is a no-op once timing has been cleared (post-logout)', () => {
        const start = 1_000_000
        markSessionStarted(start)
        clearSessionTiming()
        recordActivity(start + 1)
        expect(isSessionExpired(start + 1)).toBe(false)
        expect(localStorage.getItem('oc_auth_last_activity')).toBeNull()
    })
})
