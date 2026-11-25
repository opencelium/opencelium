import type { CSSProperties } from 'react'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { formatCronLabel, formatDuration, formatRemaining } from '@entities/schedule/ui/cronLabel'
import { ScheduleRunPopover } from '@entities/schedule/ui/calendar/ScheduleRunPopover'
import { scheduleName } from '@entities/schedule/ui/calendar/scheduleName'
import { useScheduleColor } from '@entities/schedule/ui/calendar/useScheduleColor'
import type { UpcomingRun } from '@entities/schedule/ui/calendar/rollingLoad'

export function UpcomingRunList({ runs, now }: { runs: UpcomingRun[]; now: number }) {
    const { t, lang } = useI18n('entities')
    const colorOf = useScheduleColor()
    return (
        <div className="schedule-upcoming">
            {runs.map(({ schedule, time }) => (
                <ScheduleRunPopover key={schedule.schedulerId} schedule={schedule}>
                    <button
                        type="button"
                        className="schedule-upcoming-row"
                        style={{ '--schedule-color': colorOf(schedule) } as CSSProperties}
                        data-testid={`dashboard-schedule-upcoming-${schedule.schedulerId}`}
                    >
                        <span className="schedule-upcoming-swatch" aria-hidden />
                        <span className="schedule-upcoming-text">
                            <span className="schedule-upcoming-title">{scheduleName(schedule)}</span>
                            <span className="schedule-upcoming-meta">
                                {formatCronLabel(schedule.cronExp, t, lang)}
                                <span className="schedule-upcoming-duration">
                                    {' · '}
                                    {t('schedule.calendar.card.avgDuration', {
                                        duration: formatDuration(schedule.lastExecution?.success?.duration),
                                    })}
                                </span>
                            </span>
                        </span>
                        <span className="schedule-upcoming-when">
                            {t('schedule.calendar.card.inDuration', { duration: formatRemaining(time - now) })}
                        </span>
                    </button>
                </ScheduleRunPopover>
            ))}
        </div>
    )
}
