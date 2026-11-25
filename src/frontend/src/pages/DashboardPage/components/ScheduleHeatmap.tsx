import { useI18n } from '@shared/i18n/hooks/useI18n'
import { loadLevel } from '@entities/schedule/ui/calendar/calendarGrid'

const HOUR_MS = 3_600_000

type Props = {
    counts: number[]
    start: number
    timeFormat: Intl.DateTimeFormat
    blockHours: 1 | 2
}

/** One row of blocks from the current hour; every third (or second, for two-hour blocks) is labelled. */
export function ScheduleHeatmap({ counts, start, timeFormat, blockHours }: Props) {
    const { t } = useI18n('entities')
    const blocks = Array.from({ length: counts.length / blockHours }, (_, index) =>
        counts.slice(index * blockHours, (index + 1) * blockHours).reduce((sum, count) => sum + count, 0),
    )
    const labelEvery = blockHours === 1 ? 3 : 2
    const timeOf = (index: number) => timeFormat.format(start + index * blockHours * HOUR_MS)
    return (
        <div className="schedule-heatmap" data-block-hours={blockHours} style={{ ['--blocks' as string]: blocks.length }}>
            <div className="schedule-heatmap-row">
                {blocks.map((count, index) => (
                    <i
                        key={index}
                        data-level={loadLevel(count)}
                        data-now={index === 0 || undefined}
                        title={t('schedule.calendar.card.hourRuns', { time: timeOf(index), count })}
                    />
                ))}
            </div>
            <div className="schedule-heatmap-axis" aria-hidden>
                {blocks.map((_, index) => (
                    <span key={index}>{index % labelEvery === 0 ? timeOf(index).slice(0, 2) : ''}</span>
                ))}
            </div>
        </div>
    )
}
