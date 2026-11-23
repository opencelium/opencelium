import { ScheduleCalendar } from '@entities/schedule/ui/ScheduleCalendar'
import type { Schedule } from '@entities/schedule/model/types'
import { useFetchEntitiesQuery } from '@shared/api/genericApi'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { Card } from '@shared/ui/primitives/Card'
import { Empty } from '@shared/ui/primitives/Empty'
import { Loading } from '@shared/ui/primitives/Loading/Loading'

const emptySchedules: Schedule[] = []

export function ScheduleCalendarCard() {
    const { t } = useI18n('entities')
    const { data, isLoading, isError } = useFetchEntitiesQuery('/scheduler/all')
    const schedules = Array.isArray(data) ? data as Schedule[] : emptySchedules

    return (
        <Card testId="dashboard-schedule-calendar-card" title={t('schedule.calendar.title')} style={{ minWidth: 0 }}>
            {isLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
                    <Loading />
                </div>
            ) : isError && !data ? (
                <Empty />
            ) : (
                <ScheduleCalendar schedules={schedules} />
            )}
        </Card>
    )
}
