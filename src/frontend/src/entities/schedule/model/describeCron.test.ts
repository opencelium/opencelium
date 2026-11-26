import { describe, expect, it } from 'vitest'
import { describeCron } from './describeCron'

describe('describeCron', () => {
    it.each([
        ['0 0 6 * * ?', { kind: 'daily', times: ['06:00'] }],
        ['0 30 6 * * ?', { kind: 'daily', times: ['06:30'] }],
        ['0 0 8 ? * MON', { kind: 'weekly', days: [1], times: ['08:00'] }],
        ['0 0 8 ? * 1', { kind: 'weekly', days: [7], times: ['08:00'] }],
        ['0 0 8 ? * MON,WED', { kind: 'weekly', days: [1, 3], times: ['08:00'] }],
        ['0 */5 * * * ?', { kind: 'everyMinutes', step: 5 }],
        ['0 0/15 * * * ?', { kind: 'everyMinutes', step: 15 }],
        ['0 * * * * ?', { kind: 'everyMinutes', step: 1 }],
        ['0 0 7 ? * MON-FRI', { kind: 'weekdays', times: ['07:00'] }],
        ['0 0 7 ? * 2-6', { kind: 'weekdays', times: ['07:00'] }],
        ['0 0 7 ? * SUN-SAT', { kind: 'daily', times: ['07:00'] }],
        ['0 0 3 1 * ?', { kind: 'monthly', day: 1, times: ['03:00'] }],
        ['0 15 14,2 * * ?', { kind: 'daily', times: ['02:15', '14:15'] }],
        ['0 0 7 * * ? *', { kind: 'daily', times: ['07:00'] }],
    ])('%s', (expression, expected) => {
        expect(describeCron(expression)).toEqual(expected)
    })

    it.each([
        '0 0/7 9-17 ? * MON#2',
        '0 0 1,2,3,4 * * ?',
        '0 0 7 L * ?',
        '0 0 7 * 1 ?',
        '0 0 7 * * ? 2027',
        '*/10 * * * * ?',
        '0 0 7 ? * FRI-MON',
        'nonsense',
        '',
    ])('keeps %s as the expression', (expression) => {
        expect(describeCron(expression)).toEqual({ kind: 'raw', expression: expression.trim() })
    })
})
