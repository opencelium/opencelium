import {expect, it} from 'vitest'
import {upcomingRuns} from './upcomingRuns'

const start = Date.parse('2026-10-23T10:00:00Z')
it.each([
    ['0 0 8 * * ?', '2026-10-24T03:00:00Z', 86400000],
    ['0 0 8 ? * 2-6', '2026-10-26T03:00:00Z', 86400000],
    ['0 0/15 * * * ?', '2026-10-23T10:15:00Z', 900000],
])('returns five Quartz runs for %s', (cron, first, step) => {
    expect(upcomingRuns(cron, start, 5, 'Asia/Tashkent'))
        .toEqual(Array.from({length: 5}, (_, index) => Date.parse(first) + index * step))
})
it('distinguishes impossible dates from invalid syntax', () => {
    expect(upcomingRuns('0 0 8 30 2 ?', start, 5, 'UTC')).toEqual([])
    expect(upcomingRuns('invalid', start, 5, 'UTC')).toBeNull()
})
