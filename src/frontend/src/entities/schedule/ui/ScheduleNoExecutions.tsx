import {Empty} from '@shared/ui/primitives/Empty'
import {useI18n} from '@shared/i18n/hooks/useI18n'

// Empty-state shown when an expanded schedule has no running executions.
export function ScheduleNoExecutions() {
    const {t: tEntities} = useI18n('entities')
    return (
        <div style={{padding: '8px 0'}}>
            <Empty description={tEntities('schedule.list.noExecutions')} />
        </div>
    )
}
