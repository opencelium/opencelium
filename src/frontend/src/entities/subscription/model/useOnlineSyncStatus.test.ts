import { describe, expect, it } from 'vitest'
import { resolveSyncActive } from './useOnlineSyncStatus'
import type { SyncStatus } from './types'

const status = (
    active: boolean,
    invoker: boolean,
    template: boolean,
): SyncStatus => ({
    active,
    invoker_sync: { active: invoker },
    template_sync: { active: template },
})

describe('resolveSyncActive', () => {
    it('is false while the status is unknown', () => {
        expect(resolveSyncActive(undefined)).toBe(false)
        expect(resolveSyncActive(undefined, 'invoker')).toBe(false)
    })

    it('follows the master switch when no scope is given', () => {
        expect(resolveSyncActive(status(true, false, false))).toBe(true)
        expect(resolveSyncActive(status(false, true, true))).toBe(false)
    })

    it('requires both the master switch and the service flag for a scope', () => {
        // The master switch off means the service flag is moot, even when set.
        expect(resolveSyncActive(status(false, true, true), 'invoker')).toBe(false)
        expect(resolveSyncActive(status(true, true, false), 'invoker')).toBe(true)
        expect(resolveSyncActive(status(true, true, false), 'template')).toBe(false)
    })
})
