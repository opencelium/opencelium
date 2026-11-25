export type CronDescription =
    | { kind: 'everyMinutes'; step: number }
    | { kind: 'daily'; times: string[] }
    | { kind: 'weekdays'; times: string[] }
    | { kind: 'weekly'; days: number[]; times: string[] }
    | { kind: 'monthly'; day: number; times: string[] }
    | { kind: 'raw'; expression: string }

const MAX_LISTED_TIMES = 3
const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
const NUMBER = /^\d{1,2}$/

const isAny = (field: string) => field === '*' || field === '?'

function parseQuartzWeekday(token: string): number | null {
    const named = DAY_NAMES.indexOf(token.toUpperCase())
    const quartz = named >= 0 ? named + 1 : NUMBER.test(token) ? Number(token) : NaN
    return quartz >= 1 && quartz <= 7 ? quartz : null
}

// Ranges are read in Quartz order, 1 (Sunday) … 7 (Saturday); the result is ISO, 1 (Monday) … 7 (Sunday).
function parseWeekdays(field: string): number[] | null {
    const days = new Set<number>()
    for (const part of field.split(',')) {
        const [from, to, ...rest] = part.split('-')
        if (rest.length) return null
        const start = parseQuartzWeekday(from)
        const end = to === undefined ? start : parseQuartzWeekday(to)
        if (start === null || end === null || end < start) return null
        for (let day = start; day <= end; day++) days.add(day === 1 ? 7 : day - 1)
    }
    return [...days].sort((a, b) => a - b)
}

function parseTimes(minuteField: string, hourField: string): string[] | null {
    if (!NUMBER.test(minuteField)) return null
    const minute = Number(minuteField)
    const hours = hourField.split(',')
    if (minute > 59 || hours.length > MAX_LISTED_TIMES || !hours.every((hour) => NUMBER.test(hour) && Number(hour) <= 23)) {
        return null
    }
    const pad = (value: number) => String(value).padStart(2, '0')
    return hours
        .map(Number)
        .sort((a, b) => a - b)
        .map((hour) => `${pad(hour)}:${pad(minute)}`)
}

/**
 * Recognises the handful of Quartz shapes people actually use and returns them as data;
 * anything else is `raw`, so the caller shows the expression rather than a wrong sentence.
 */
export function describeCron(expression: string): CronDescription {
    const trimmed = expression.trim()
    const raw: CronDescription = { kind: 'raw', expression: trimmed }
    const fields = trimmed.split(/\s+/)
    if (fields.length < 6 || fields.length > 7) return raw
    const [second, minute, hour, dayOfMonth, month, dayOfWeek, year = '*'] = fields
    if (!NUMBER.test(second) || month !== '*' || year !== '*') return raw

    if (hour === '*' && isAny(dayOfMonth) && isAny(dayOfWeek)) {
        if (minute === '*') return { kind: 'everyMinutes', step: 1 }
        const step = /^(?:0|\*)\/(\d+)$/.exec(minute)
        return step && Number(step[1]) > 0 ? { kind: 'everyMinutes', step: Number(step[1]) } : raw
    }

    const times = parseTimes(minute, hour)
    if (!times) return raw

    if (isAny(dayOfMonth) && isAny(dayOfWeek)) return { kind: 'daily', times }

    if (isAny(dayOfMonth)) {
        const days = parseWeekdays(dayOfWeek)
        if (!days) return raw
        if (days.length === 7) return { kind: 'daily', times }
        if (days.join() === '1,2,3,4,5') return { kind: 'weekdays', times }
        return { kind: 'weekly', days, times }
    }

    if (isAny(dayOfWeek) && NUMBER.test(dayOfMonth) && Number(dayOfMonth) >= 1 && Number(dayOfMonth) <= 31) {
        return { kind: 'monthly', day: Number(dayOfMonth), times }
    }

    return raw
}
