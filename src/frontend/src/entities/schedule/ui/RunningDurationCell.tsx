import {useEffect, useState} from 'react'
import {DurationCell} from './DurationCell'

const TICK_MS = 1000

// Live elapsed time for an in-flight execution, ticking every second. Based on the
// server start instant so it matches the start time shown in the adjacent column;
// clamped at 0 to stay sane under clock skew. Reuses DurationCell's formatting.
export function RunningDurationCell({serverStartTime}: {serverStartTime: number}) {
    const [now, setNow] = useState(() => Date.now())

    useEffect(() => {
        const handle = setInterval(() => setNow(Date.now()), TICK_MS)
        return () => clearInterval(handle)
    }, [])

    return <DurationCell duration={Math.max(0, now - serverStartTime)} />
}
