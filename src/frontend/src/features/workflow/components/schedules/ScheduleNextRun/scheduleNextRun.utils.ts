import {getScheduleTimeZone, upcomingRuns} from '@shared/lib/cron/upcomingRuns'

export const getNextTriggerTimes = upcomingRuns

export function getNextTriggerMs(cronExp: string, fromMs: number): number | null {
    const zone = getScheduleTimeZone()
    return getNextTriggerTimes(cronExp, fromMs, 1, zone)?.[0] ?? null
}

export function formatScheduleRemaining(ms: number): string {
    const seconds = Math.max(0, Math.floor(ms / 1000))
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ${seconds % 60}s`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ${minutes % 60}m`
    const days = Math.floor(hours / 24)
    return `${days}d ${hours % 24}h`
}
