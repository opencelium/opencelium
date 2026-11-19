import { describe, expect, it } from 'vitest'
import { readConflict, readErrorMessage, readViolations } from './errors'

describe('global variable error readers', () => {
    it('reads a 409 conflict with its blocking usages', () => {
        const error = {
            status: 409,
            data: { code: 'IN_USE', message: 'still used', blocking: [{ sourceType: 'WORKFLOW', sourceId: 1, sourceTitle: 'A', reason: 'IN_USE' }] },
        }
        expect(readConflict(error)).toMatchObject({ code: 'IN_USE', message: 'still used', blocking: [{ sourceId: 1 }] })
        expect(readConflict({ status: 409, data: { code: 'VERSION_CONFLICT', currentVersion: 5 } })).toMatchObject({ currentVersion: 5, blocking: [] })
    })

    it('ignores anything that is not a coded 409', () => {
        expect(readConflict({ status: 400, data: { code: 'X' } })).toBeNull()
        expect(readConflict({ status: 409, data: 'text' })).toBeNull()
        expect(readConflict(undefined)).toBeNull()
    })

    it('reads 400 violations and plain messages', () => {
        const error = { status: 400, data: { message: 'Name is already taken', violations: [{ field: 'name', code: 'NAME_TAKEN', message: 'taken' }] } }
        expect(readViolations(error)).toEqual([{ field: 'name', code: 'NAME_TAKEN', message: 'taken' }])
        expect(readViolations({ status: 409, data: {} })).toEqual([])
        expect(readErrorMessage(error)).toBe('Name is already taken')
    })
})
