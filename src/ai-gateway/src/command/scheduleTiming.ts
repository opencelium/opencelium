import { z } from 'zod'

export const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const

/** When a schedule runs, as the model can say it reliably; `toQuartzCron` writes the cron, the model never does. */
export const scheduleTimingSchema = z.object({
    frequency: z.enum(['minutes', 'hourly', 'daily', 'weekly', 'monthly', 'unknown']),
    /** "every 15 minutes", "every 2 hours"; 1 otherwise. */
    every: z.number().int().min(1).max(59),
    /** "HH:MM" in 24 h, empty when no time was said. */
    time: z.string(),
    weekdays: z.array(z.enum(WEEKDAYS)),
    /** 1–31 for "on the 5th", 0 when none was said. */
    dayOfMonth: z.number().int().min(0).max(31),
})

export type ScheduleTiming = z.infer<typeof scheduleTimingSchema>

// Quartz numbers weekdays from Sunday = 1; the frontend's cron picker reads numbers, not MON/TUE names.
const QUARTZ_DAY: Record<(typeof WEEKDAYS)[number], number> = { SUN: 1, MON: 2, TUE: 3, WED: 4, THU: 5, FRI: 6, SAT: 7 }

function clockOf(time: string): { hour: number; minute: number } {
    const match = /^(\d{1,2})(?::(\d{2}))?$/.exec(time.trim())
    const hour = match ? Number(match[1]) : 0
    const minute = match?.[2] ? Number(match[2]) : 0
    return hour <= 23 && minute <= 59 ? { hour, minute } : { hour: 0, minute: 0 }
}

/**
 * The 6-field Quartz expression (seconds first, `?` in one of the day fields) the scheduler stores, or '' when the
 * timing is unknown: the user then sets it in the form instead of getting a guess.
 */
export function toQuartzCron(timing: ScheduleTiming): string {
    const { hour, minute } = clockOf(timing.time)
    const every = Math.max(1, timing.every)
    switch (timing.frequency) {
        case 'minutes':
            return every === 1 ? '0 * * * * ?' : `0 0/${every} * * * ?`
        case 'hourly':
            return every === 1 ? `0 ${minute} * * * ?` : `0 ${minute} 0/${every} * * ?`
        case 'daily':
            return `0 ${minute} ${hour} * * ?`
        case 'weekly': {
            const days = [...new Set(timing.weekdays)].map((day) => QUARTZ_DAY[day]).sort((left, right) => left - right)
            return `0 ${minute} ${hour} ? * ${days.length ? days.join(',') : QUARTZ_DAY.MON}`
        }
        case 'monthly':
            return `0 ${minute} ${hour} ${timing.dayOfMonth || 1} * ?`
        case 'unknown':
            return ''
        default: {
            const _exhaustive: never = timing.frequency
            return _exhaustive
        }
    }
}
