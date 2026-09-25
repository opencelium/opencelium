import { CalendarClock } from 'lucide-react'
import { Tooltip } from '@shared/ui/primitives/Tooltip'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { useWorkflowSchedules, type ScheduleAggregateStatus } from '../useWorkflowSchedules'
import type { WorkflowSchedulesPillProps } from './WorkflowSchedulesPill.types'

const STATUS_LABEL_KEY: Record<ScheduleAggregateStatus, string> = {
    running: 'schedules.aggregate.running',
    error: 'schedules.aggregate.error',
    ok: 'schedules.aggregate.ok',
    idle: 'schedules.aggregate.idle',
}

export function WorkflowSchedulesPill({ connectionId, open, onToggle }: WorkflowSchedulesPillProps) {
    const { t } = useI18n('workflow')
    const { aggregate, count } = useWorkflowSchedules(connectionId)
    const tooltip = count > 0 ? t(STATUS_LABEL_KEY[aggregate]) : t('schedules.pill.tooltip')

    return <Tooltip content={tooltip}>
        <button type="button"
            className={`iconButton wf-schedules-pill ${open ? 'wf-schedules-pill--active' : ''}`}
            onClick={onToggle} data-testid="workflow-schedules-pill">
            <CalendarClock size={16} />
            <span className={`wf-schedules-pill__dot wf-schedules-pill__dot--${aggregate}`} />
            <span className="wf-schedules-pill__count">{count}</span>
        </button>
    </Tooltip>
}
