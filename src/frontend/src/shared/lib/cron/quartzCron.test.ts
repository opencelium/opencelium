import {describe, expect, it} from 'vitest';
import {quartzToPickerCron, quartzToStandardCron} from './quartzCron';
import {CronExpressionParser} from 'cron-parser';
describe('Quartz cron adapters', () => {
    it.each([['1', 'SUN'], ['2-6', 'MON-FRI'], ['2,7', 'MON,SAT'], ['MON-FRI', 'MON-FRI']])(
        'maps weekday %s', (input, expected) => {
            expect(quartzToStandardCron(`0 0 7 ? * ${input}`)).toBe(`0 0 7 ? * ${expected}`);
        },
    );
    it('expands numeric steps only for the picker', () => {
        expect(quartzToPickerCron('0 0/5 * * * ?')).toBe('0-59/5 * * * *');
        expect(quartzToPickerCron('0 10/5 * * * ?')).toBe('10-59/5 * * * *');
    });
    it.each([
        ['0 45 16 ? * 2', '2026-10-19T16:45:00.000Z'],
        ['0 0/5 * * * ?', '2026-10-19T16:05:00.000Z'],
    ])('calculates the next Quartz trigger for %s', (cron, expected) => {
        const next = CronExpressionParser.parse(quartzToStandardCron(cron), {
            currentDate: new Date('2026-10-19T16:01:00Z'), tz: 'UTC',
        }).next();
        expect(next.toISOString()).toBe(expected);
    });
});
