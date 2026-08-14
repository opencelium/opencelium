import { Loading } from '@shared/ui/primitives/Loading/Loading'
import { Empty } from '@shared/ui/primitives/Empty'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { ScheduleCard } from '../ScheduleCard/ScheduleCard'
import type { useWorkflowSchedules } from '../useWorkflowSchedules'

type Props = Pick<ReturnType<typeof useWorkflowSchedules>, 'items' | 'isLoading' | 'count'> & {
    hasConnection: boolean
}

export function WorkflowSchedulesPanelBody({ hasConnection, items, isLoading, count }: Props) {
    const { t } = useI18n('workflow')
    if (!hasConnection) {
        return <Empty className="wf-schedule-empty" description={t('schedules.saveFirst')} />
    }
    if (isLoading) return <div className="wf-schedule-loading"><Loading /></div>
    if (count === 0) {
        return <Empty className="wf-schedule-empty" description={t('schedules.empty')} />
    }
    return <div className="wf-schedule-list">
        {items.map((item) => <ScheduleCard key={item.schedule.schedulerId} item={item} />)}
    </div>
}
