import { describeCron } from '../model/describeCron'

type Translate = (key: string, values?: Record<string, unknown>) => string

const listFormat = (lang: string, items: string[]) =>
    new Intl.ListFormat(lang, { style: 'long', type: 'conjunction' }).format(items)

const weekdayName = (lang: string, isoDay: number) =>
    // 2024-01-01 was a Monday, so ISO day n falls on January n.
    new Intl.DateTimeFormat(lang, { weekday: 'long', timeZone: 'UTC' }).format(Date.UTC(2024, 0, isoDay))

export function formatCronLabel(expression: string, t: Translate, lang: string): string {
    const description = describeCron(expression)
    switch (description.kind) {
        case 'everyMinutes':
            return t('schedule.cronText.everyMinutes', { count: description.step })
        case 'daily':
            return t('schedule.cronText.daily', { times: listFormat(lang, description.times) })
        case 'weekdays':
            return t('schedule.cronText.weekdays', { times: listFormat(lang, description.times) })
        case 'weekly':
            return t('schedule.cronText.weekly', {
                days: listFormat(lang, description.days.map((day) => weekdayName(lang, day))),
                times: listFormat(lang, description.times),
            })
        case 'monthly':
            return t('schedule.cronText.monthly', { day: description.day, times: listFormat(lang, description.times) })
        case 'raw':
            return description.expression
        default: {
            const _exhaustive: never = description
            return _exhaustive
        }
    }
}

export function formatRemaining(ms: number): string {
    const totalSec = Math.max(0, Math.floor(ms / 1000))
    if (totalSec < 60) return `${totalSec}s`
    const totalMin = Math.floor(totalSec / 60)
    if (totalMin < 60) return `${totalMin}m ${totalSec % 60}s`
    const totalHour = Math.floor(totalMin / 60)
    if (totalHour < 24) return `${totalHour}h ${totalMin % 60}m`
    const totalDay = Math.floor(totalHour / 24)
    return `${totalDay}d ${totalHour % 24}h`
}

export function formatDuration(duration?: number): string {
    if (!duration) return '-'
    const seconds = Math.trunc(duration / 1000)
    return seconds === 0 ? '<1s' : `${seconds}s`
}
