import { useEffect, useState } from 'react'
import { CronExpressionParser } from 'cron-parser'
import { useI18n } from '@shared/i18n/hooks/useI18n'

const TICK_MS = 1000

function getNextTriggerMs(cronExp: string, fromMs: number): number | null {
    try {
        const interval = CronExpressionParser.parse(cronExp.trim(), { currentDate: new Date(fromMs) })
        return interval.next().getTime()
    } catch {
        return null
    }
}

function formatRemaining(ms: number): string {
    const totalSec = Math.max(0, Math.floor(ms / 1000))
    if (totalSec < 60) return `${totalSec}s`
    const totalMin = Math.floor(totalSec / 60)
    if (totalMin < 60) return `${totalMin}m ${totalSec % 60}s`
    const totalHour = Math.floor(totalMin / 60)
    if (totalHour < 24) return `${totalHour}h ${totalMin % 60}m`
    const totalDay = Math.floor(totalHour / 24)
    return `${totalDay}d ${totalHour % 24}h`
}

type Props = { cronExp?: string }

export function ScheduleNextRun({ cronExp }: Props) {
    const { t } = useI18n('workflow')
    const trimmed = cronExp?.trim() ?? ''
    const [now, setNow] = useState(() => Date.now())

    useEffect(() => {
        if (!trimmed) return
        const handle = setInterval(() => setNow(Date.now()), TICK_MS)
        return () => clearInterval(handle)
    }, [trimmed])

    if (!trimmed) {
        return <span className="wf-schedule-nextrun wf-schedule-nextrun--muted">{t('schedules.manual')}</span>
    }

    const nextMs = getNextTriggerMs(trimmed, now)
    if (nextMs == null) {
        return <span className="wf-schedule-nextrun wf-schedule-nextrun--muted">{t('schedules.manual')}</span>
    }

    return (
        <span className="wf-schedule-nextrun">
            {t('schedules.nextRun', { duration: formatRemaining(nextMs - now) })}
        </span>
    )
}
