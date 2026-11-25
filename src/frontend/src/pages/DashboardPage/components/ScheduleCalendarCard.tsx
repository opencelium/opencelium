import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import type { Schedule } from '@entities/schedule/model/types'
import { lastRunOutcome } from '@entities/schedule/model/lastRunOutcome'
import { nextRuns, rollingHourCounts, startOfHour } from '@entities/schedule/ui/calendar/rollingLoad'
import { useMinuteClock } from '@entities/schedule/ui/calendar/useMinuteClock'
import { useFetchEntitiesQuery } from '@shared/api/genericApi'
import { getScheduleTimeZone } from '@shared/lib/cron/upcomingRuns'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { Card } from '@shared/ui/primitives/Card'
import { Empty } from '@shared/ui/primitives/Empty'
import { Loading } from '@shared/ui/primitives/Loading/Loading'
import { ScheduleHeatmap } from './ScheduleHeatmap'
import { UpcomingRunList } from './UpcomingRunList'
import './scheduleCalendarCard.css'

const emptySchedules: Schedule[] = []
const WINDOW_HOURS = 24
const UPCOMING_COUNT = 4
export function ScheduleCalendarCard() {
    const { t, lang } = useI18n('entities')
    const { data, isLoading, isError } = useFetchEntitiesQuery('/scheduler/all')
    const schedules = Array.isArray(data) ? (data as Schedule[]) : emptySchedules
    const zone = getScheduleTimeZone()
    const now = useMinuteClock()
    const start = startOfHour(now, zone)
    const counts = useMemo(() => rollingHourCounts(schedules, start, WINDOW_HOURS, zone), [schedules, start, zone])
    const upcoming = useMemo(() => nextRuns(schedules, now, UPCOMING_COUNT, zone), [schedules, now, zone])
    const timeFormat = useMemo(
        () => new Intl.DateTimeFormat(lang, { timeZone: zone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }),
        [lang, zone],
    )
    const failed = schedules.filter((schedule) => lastRunOutcome(schedule) === 'failure').length
    const summary = [
        t('schedule.calendar.card.count', { count: schedules.length }),
        ...(failed > 0 ? [t('schedule.calendar.card.failed', { count: failed })] : []),
    ].join(' · ')

    return (
        <Card
            testId="dashboard-schedule-calendar-card"
            className="schedule-overview-card"
            title={t('schedule.calendar.card.title')}
            extra={<span className="schedule-overview-meta">{t('schedule.calendar.card.window')}</span>}
            footer={
                <div className="schedule-overview-foot">
                    <Link to="/schedule" data-testid="dashboard-schedule-all">{t('schedule.calendar.card.all')}</Link>
                    <span className="schedule-overview-meta" data-failed={failed > 0 || undefined}>{summary}</span>
                </div>
            }
            style={{ minWidth: 0 }}
        >
            {isLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
                    <Loading />
                </div>
            ) : isError && !data ? (
                <Empty />
            ) : (
                <div className="schedule-overview">
                    <ScheduleHeatmap counts={counts} start={start} timeFormat={timeFormat} blockHours={1} />
                    <ScheduleHeatmap counts={counts} start={start} timeFormat={timeFormat} blockHours={2} />
                    {upcoming.length > 0 ? (
                        <UpcomingRunList runs={upcoming} now={now} />
                    ) : (
                        <p className="schedule-overview-empty">{t('schedule.preview.empty')}</p>
                    )}
                </div>
            )}
        </Card>
    )
}
