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
    expect(upcomingRuns('0 0 8 * * MON', start, 5, 'UTC')).toBeNull()
    expect(upcomingRuns('0 ? 8 * * ?', start, 5, 'UTC')).toBeNull()
    expect(upcomingRuns('0 H 8 * * ?', start, 5, 'UTC')).toBeNull()
})

it('limits runs to the requested Quartz years in the schedule zone', () => {
    expect(upcomingRuns('0 0 8 * * ? 2027', start, 2, 'Asia/Tashkent')).toEqual([
        Date.parse('2027-01-01T03:00:00Z'),
        Date.parse('2027-01-02T03:00:00Z'),
    ])
    expect(upcomingRuns('0 0 8 * * ? 2025', start, 5, 'Asia/Tashkent')).toEqual([])
    expect(upcomingRuns('0 0 8 * * ? invalid', start, 5, 'UTC')).toBeNull()
})

it.each([
    ['15W', ['2026-01-15T07:00:00Z', '2026-02-16T07:00:00Z', '2026-03-16T07:00:00Z']],
    ['1W', ['2026-01-01T07:00:00Z', '2026-02-02T07:00:00Z', '2026-03-02T07:00:00Z']],
    ['31W', ['2026-01-30T07:00:00Z', '2026-03-31T06:00:00Z', '2026-05-29T06:00:00Z']],
    ['LW', ['2026-01-30T07:00:00Z', '2026-02-27T07:00:00Z', '2026-03-31T06:00:00Z']],
    ['L-3', ['2026-01-28T07:00:00Z', '2026-02-25T07:00:00Z', '2026-03-28T07:00:00Z']],
    ['L-3W', ['2026-01-28T07:00:00Z', '2026-02-25T07:00:00Z', '2026-03-27T07:00:00Z']],
])('matches Quartz for day-of-month rule %s', (rule, expected) => {
    const from = Date.parse('2026-01-01T00:00:00Z')
    expect(upcomingRuns(`0 0 8 ${rule} * ?`, from, 3, 'Europe/Berlin'))
        .toEqual(expected.map(Date.parse))
})

it('finds no runs when the requested weekday is beyond the month', () => {
    expect(upcomingRuns('0 0 8 31W 2 ? 2027', start, 5, 'UTC')).toEqual([])
    expect(upcomingRuns('0 0 8 32W * ?', start, 5, 'UTC')).toBeNull()
})

it.each([
    ['0 30 2 * * ?', '2026-03-29T00:45:00Z', ['2026-03-30T00:30:00Z', '2026-03-31T00:30:00Z']],
    ['0 30 2 * * ?', '2026-10-24T23:45:00Z', ['2026-10-25T01:30:00Z', '2026-10-26T01:30:00Z']],
    ['0 30 2 * * ?', '2026-10-25T00:59:59Z', ['2026-10-25T01:30:00Z', '2026-10-26T01:30:00Z']],
    ['0 0/15 * * * ?', '2026-10-25T00:00:00Z', ['2026-10-25T01:15:00Z', '2026-10-25T01:30:00Z']],
    ['0 0/15 * * * ?', '2026-10-25T00:59:59Z', ['2026-10-25T01:00:00Z', '2026-10-25T01:15:00Z']],
])('matches Quartz clock changes for %s from %s', (cron, from, expected) => {
    expect(upcomingRuns(cron, Date.parse(from), expected.length, 'Europe/Berlin'))
        .toEqual(expected.map(Date.parse))
})

it.each([
    ['0 0 8 ? * FRI-MON', ['2026-11-01T08:00:00Z', '2026-11-02T08:00:00Z', '2026-11-06T08:00:00Z']],
    ['0 0 8 ? * L', ['2026-11-07T08:00:00Z', '2026-11-14T08:00:00Z', '2026-11-21T08:00:00Z']],
    ['0 0 8 ? * 2/3', ['2026-11-02T08:00:00Z', '2026-11-05T08:00:00Z', '2026-11-09T08:00:00Z']],
    ['0 50-10/10 8 * * ?', ['2026-11-01T08:00:00Z', '2026-11-01T08:10:00Z', '2026-11-01T08:50:00Z']],
])('matches Quartz ranges and weekday rules for %s', (cron, expected) => {
    const from = Date.parse('2026-11-01T00:00:00Z')
    expect(upcomingRuns(cron, from, expected.length, 'UTC')).toEqual(expected.map(Date.parse))
})
