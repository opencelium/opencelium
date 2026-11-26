import {memo} from 'react'
import {useI18n} from '@shared/i18n/hooks/useI18n'
import {useSubscriptionIssue} from '@entities/subscription/model/useSubscriptionIssue'
import {CronCountdown} from '@entities/schedule/ui/CronCountdown'
import {PlayControl, type PlayVariant, type RingStatus} from './PlayControl'
import type {Schedule} from '../model/types'
import {lastRunOutcome} from '../model/lastRunOutcome'
import './StatusCell.css'

type Props = {
    schedule: Schedule
    // The workflow schedule panel shows a readable "next run" text elsewhere and
    // suppresses the inline countdown to avoid duplicating it.
    showCountdown?: boolean
}

function resolveRing(schedule: Schedule): RingStatus | null {
    const outcome = lastRunOutcome(schedule)
    if (outcome === null) return null
    return outcome === 'success' ? 'success' : 'exception'
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
