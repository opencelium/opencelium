import {useEffect, useState} from 'react'
import {Progress} from 'antd'
import {Tooltip} from '@shared/ui/primitives/Tooltip'
import {formatExecutionDate, formatExecutionTime} from './formatExecutionDate'

const PROGRESS_TICK_MS = 200
const EXEC_CIRCLE_SIZE = 22

function computePercent(localStartTime: number, avgDuration: number, now: number): number {
    if (avgDuration <= 0) return 0
    const elapsed = now - localStartTime
    return Math.min(95, Math.max(0, (elapsed / avgDuration) * 100))
}

type Props = {
    localStartTime: number
    serverStartTime: number
    avgDuration: number
}

// One in-flight execution: a live progress ring + its start time. Read-only — the
// backend has no per-execution terminate endpoint, so there is no action here.
export function RunningExecBadge({localStartTime, serverStartTime, avgDuration}: Props) {
    const [now, setNow] = useState(() => Date.now())

    useEffect(() => {
        const handle = setInterval(() => setNow(Date.now()), PROGRESS_TICK_MS)
        return () => clearInterval(handle)
    }, [])

    const percent = computePercent(localStartTime, avgDuration, now)

    return (
        <Tooltip content={formatExecutionDate(serverStartTime)}>
            <div className="status-cell__exec">
                <Progress
                    type="circle"
                    percent={percent}
                    size={EXEC_CIRCLE_SIZE}
                    status="active"
                    format={() => <span style={{fontSize: 8}}>{Math.round(percent)}%</span>}
                />
                <span className="status-cell__exec-time">{formatExecutionTime(serverStartTime)}</span>
            </div>
        </Tooltip>
    )
}
