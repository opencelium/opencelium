import {useEffect, useState, type ReactNode} from 'react'
import {message, Progress} from 'antd'
import {IconButton} from '@shared/ui/primitives/IconButton'
import {Loading} from '@shared/ui/primitives/Loading/Loading'
import {Tooltip} from '@shared/ui/primitives/Tooltip'
import {useGeneralRequestMutation} from '@shared/api/genericApi'
import {useI18n} from '@shared/i18n/hooks/useI18n'
import {useCurrentSchedules} from '@entities/schedule/socket/useCurrentSchedules'
import {CronCountdown} from '@entities/schedule/ui/CronCountdown'
import type {Schedule, ScheduleExecutionRun} from '../model/types'
import {Icon} from "@shared/ui/primitives/Icon";
import './StatusCell.css'

type Props = {
    schedule: Schedule
}

type RingStatus = 'success' | 'exception'
type PlayVariant = 'bare' | 'neutral' | RingStatus

const NEUTRAL_STROKE = '#bfbfbf'
const NEUTRAL_TRAIL = '#f0f0f0'

const CIRCLE_SIZE = 28
const PROGRESS_TICK_MS = 200
const TERMINATE_GRACE_MS = 5000

function computeEndTime(run?: ScheduleExecutionRun): number {
    if (!run?.startTime) return 0
    return run.startTime + (run.duration ?? 0)
}

function computePercent(localStartTime: number, avgDuration: number, now: number): number {
    if (avgDuration <= 0) return 0
    const elapsed = now - localStartTime
    return Math.min(95, Math.max(0, (elapsed / avgDuration) * 100))
}

function resolveRing(schedule: Schedule): RingStatus | null {
    const successEnd = computeEndTime(schedule.lastExecution?.success)
    const failEnd = computeEndTime(schedule.lastExecution?.fail)
    if (successEnd === 0 && failEnd === 0) return null
    return successEnd >= failEnd ? 'success' : 'exception'
}

function RunningCircle({
    schedule,
    localStartTime,
    avgDuration,
}: {
    schedule: Schedule
    localStartTime: number
    avgDuration: number
}) {
    const {t: tEntities} = useI18n('entities')
    const [generalRequest] = useGeneralRequestMutation()
    const [now, setNow] = useState(() => Date.now())
    const [hovered, setHovered] = useState(false)
    const [pending, setPending] = useState(false)

    useEffect(() => {
        const handle = setInterval(() => setNow(Date.now()), PROGRESS_TICK_MS)
        return () => clearInterval(handle)
    }, [])

    const percent = computePercent(localStartTime, avgDuration, now)
    const elapsed = now - localStartTime
    const showTerminate = elapsed < TERMINATE_GRACE_MS || hovered

    const handleTerminate = async () => {
        setPending(true)
        try {
            await generalRequest({
                url: `/scheduler/terminate/${schedule.schedulerId}`,
                method: 'GET',
                options: {},
            }).unwrap()
            message.success(tEntities('schedule.terminate.success'))
        } catch {
            // error surfaced by errorBus
        } finally {
            setPending(false)
        }
    }

    const center = pending ? (
        <Loading inline size="xs" />
    ) : showTerminate ? (
        <Icon name="stop" size={14} color="danger" />
    ) : (
        <span style={{fontSize: 9}}>{Math.round(percent)}%</span>
    )

    return (
        <Tooltip content={tEntities('schedule.terminate.tooltip')}>
            <button
                type="button"
                onClick={handleTerminate}
                disabled={pending}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                style={{
                    border: 'none',
                    background: 'transparent',
                    padding: 0,
                    cursor: pending ? 'wait' : 'pointer',
                    display: 'inline-flex',
                    lineHeight: 0,
                }}
            >
                <Progress
                    type="circle"
                    percent={percent}
                    size={CIRCLE_SIZE}
                    status="active"
                    format={() => center}
                />
            </button>
        </Tooltip>
    )
}

function FinishedCircle({schedule, lastProgressPercent}: {schedule: Schedule; lastProgressPercent: number}) {
    const ring = resolveRing(schedule)
    if (ring === 'success') {
        return (
            <Progress
                type="circle"
                percent={100}
                size={CIRCLE_SIZE}
                status="success"
                format={() => <Icon name="check" size={14} color="default" />}
            />
        )
    }
    return (
        <Progress
            type="circle"
            percent={lastProgressPercent}
            size={CIRCLE_SIZE}
            status="exception"
            format={() => <Icon name="close" size={14} color="danger" />}
        />
    )
}

function PlayControl({schedule, variant}: {schedule: Schedule; variant: PlayVariant}) {
    const {t: tEntities} = useI18n('entities')
    const [generalRequest] = useGeneralRequestMutation()
    const [pending, setPending] = useState(false)

    const handleClick = async () => {
        setPending(true)
        try {
            await generalRequest({
                url: `/scheduler/execute/${schedule.schedulerId}`,
                method: 'GET',
                options: {},
            }).unwrap()
            message.success(tEntities('schedule.start.success'))
        } catch {
            // error surfaced by errorBus
        } finally {
            setPending(false)
        }
    }

    if (variant === 'bare') {
        return (
            <Tooltip content={tEntities('schedule.start.tooltip')}>
                <IconButton
                    iconProps={{name: 'play', color: 'primary'}}
                    size="xs"
                    type="text"
                    loading={pending}
                    onClick={handleClick}
                />
            </Tooltip>
        )
    }

    const ringProps =
        variant === 'neutral'
            ? {strokeColor: NEUTRAL_STROKE, trailColor: NEUTRAL_TRAIL}
            : {status: variant}

    return (
        <Tooltip content={tEntities('schedule.start.tooltip')}>
            <button
                type="button"
                onClick={handleClick}
                disabled={pending}
                style={{
                    border: 'none',
                    background: 'transparent',
                    padding: 0,
                    cursor: pending ? 'wait' : 'pointer',
                    display: 'inline-flex',
                    lineHeight: 0,
                }}
            >
                <Progress
                    type="circle"
                    percent={100}
                    size={CIRCLE_SIZE}
                    {...ringProps}
                    format={() =>
                        pending ? (
                            <Loading inline size="xs" />
                        ) : (
                            <Icon name="play" size={14} color="primary" />
                        )
                    }
                />
            </button>
        </Tooltip>
    )
}

function pickBody(
    schedule: Schedule,
    status: ReturnType<ReturnType<typeof useCurrentSchedules>['getRunStatus']>,
): ReactNode {
    switch (status.kind) {
        case 'running':
            return (
                <RunningCircle
                    schedule={schedule}
                    localStartTime={status.localStartTime}
                    avgDuration={status.avgDuration}
                />
            )
        case 'just-finished':
            return (
                <FinishedCircle
                    schedule={schedule}
                    lastProgressPercent={status.lastProgressPercent}
                />
            )
        case 'idle': {
            const ring = resolveRing(schedule)
            const variant: PlayVariant = ring ?? (schedule.cronExp?.trim() ? 'bare' : 'neutral')
            return <PlayControl schedule={schedule} variant={variant} />
        }
        default: {
            const _exhaustive: never = status
            return _exhaustive
        }
    }
}

export function StatusCell({schedule}: Props) {
    const {getRunStatus} = useCurrentSchedules()
    const status = getRunStatus(schedule.schedulerId)
    return (
        <div className="status-cell">
            <div style={{minHeight: 34}}>
                {pickBody(schedule, status)}
            </div>
            <CronCountdown cronExp={schedule.cronExp} />
        </div>
    )
}
