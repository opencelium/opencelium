import { useEffect, useState } from 'react'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import type { ScheduleNextRunProps } from './ScheduleNextRun.types'
import { formatScheduleRemaining, getNextTriggerMs } from './scheduleNextRun.utils'

const TICK_MS = 1000

export function ScheduleNextRun({ cronExp }: ScheduleNextRunProps) {
    const { t } = useI18n('workflow')
    const expression = cronExp?.trim() ?? ''
    const [now, setNow] = useState(() => Date.now())

    useEffect(() => {
        if (!expression) return
        const handle = setInterval(() => setNow(Date.now()), TICK_MS)
        return () => clearInterval(handle)
    }, [expression])

    const nextMs = expression ? getNextTriggerMs(expression, now) : null
    if (nextMs == null) {
        return <span className="wf-schedule-nextrun wf-schedule-nextrun--muted">
            {t('schedules.manual')}
        </span>
    }
    return <span className="wf-schedule-nextrun">
        {t('schedules.nextRun', { duration: formatScheduleRemaining(nextMs - now) })}
    </span>
}
