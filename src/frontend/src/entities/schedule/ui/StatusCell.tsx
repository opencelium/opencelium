import {memo} from 'react'
import {useI18n} from '@shared/i18n/hooks/useI18n'
import {useSubscriptionIssue} from '@entities/subscription/model/useSubscriptionIssue'
import {CronCountdown} from '@entities/schedule/ui/CronCountdown'
import {PlayControl, type PlayVariant, type RingStatus} from './PlayControl'
import type {Schedule, ScheduleExecutionRun} from '../model/types'
import './StatusCell.css'

type Props = {
    schedule: Schedule
    // The workflow schedule panel shows a readable "next run" text elsewhere and
    // suppresses the inline countdown to avoid duplicating it.
    showCountdown?: boolean
}

function computeEndTime(run?: ScheduleExecutionRun): number {
    if (!run?.startTime) return 0
    return run.startTime + (run.duration ?? 0)
}

function resolveRing(schedule: Schedule): RingStatus | null {
    const successEnd = computeEndTime(schedule.lastExecution?.success)
    const failEnd = computeEndTime(schedule.lastExecution?.fail)
    if (successEnd === 0 && failEnd === 0) return null
    return successEnd >= failEnd ? 'success' : 'exception'
}

export const StatusCell = memo(function StatusCell({schedule, showCountdown = true}: Props) {
    const {t: tEntities} = useI18n('entities')
    const {issue} = useSubscriptionIssue()
    const blockedHint = issue ? tEntities(`subscription.banner.${issue}` as never) : null
    const ring = resolveRing(schedule)
    const variant: PlayVariant = ring ?? (schedule.cronExp?.trim() ? 'bare' : 'neutral')

    return (
        <div className="status-cell">
            <PlayControl schedule={schedule} variant={variant} blockedHint={blockedHint} />
            {showCountdown && !issue && <CronCountdown cronExp={schedule.cronExp} />}
        </div>
    )
})
