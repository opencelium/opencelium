import {useEffect, useState} from 'react'
import {getScheduleTimeZone, upcomingRuns} from '@shared/lib/cron/upcomingRuns'
import {formatRemaining} from './cronLabel'

const TICK_MS = 1000

function getNextCronTriggerMs(cronExp: string, fromMs: number): number | null {
    const zone = getScheduleTimeZone()
    return upcomingRuns(cronExp, fromMs, 1, zone)?.[0] ?? null
}

type Props = {cronExp?: string}

export function CronCountdown({cronExp}: Props) {
    const trimmed = cronExp?.trim() ?? ''
    const [now, setNow] = useState(() => Date.now())
    useEffect(() => {
        if (!trimmed) return
        const handle = setInterval(() => setNow(Date.now()), TICK_MS)
        return () => clearInterval(handle)
    }, [trimmed])

    if (!trimmed) return null
    const nextMs = getNextCronTriggerMs(trimmed, now)
    if (nextMs == null) return null

    return (
        <span style={{fontSize: 9, color: 'var(--color-text-secondary)', lineHeight: 1, whiteSpace: 'nowrap', position: 'absolute', marginTop: 45}}>
            {formatRemaining(nextMs - now)}
        </span>
    )
}
