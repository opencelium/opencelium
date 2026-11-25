import { describe, expect, it } from 'vitest'
import { mapScheduleToApi } from './mapScheduleToApi'

const base = { schedulerId: 0, title: 'Nightly', connectionId: '7', cronExp: '0 0 6 * * ?', debugMode: false }

describe('mapScheduleToApi', () => {
    it('activates a new schedule by default', () => {
        expect(mapScheduleToApi('create', base)).toEqual({ ...base, status: true })
    })

    it('keeps an explicit status on create', () => {
        expect(mapScheduleToApi('create', { ...base, status: false })).toEqual({ ...base, status: false })
    })

    it('leaves updates untouched', () => {
        expect(mapScheduleToApi('update', { ...base, status: false })).toEqual({ ...base, status: false })
        expect(mapScheduleToApi('update', base)).toEqual(base)
    })
})
