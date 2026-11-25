import { memo } from 'react'
import { IconButton } from '@shared/ui/primitives/IconButton'
import { Tooltip } from '@shared/ui/primitives/Tooltip'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { useDialog } from '@shared/ui/dialog/useDialog'
import { useScheduleUpdatePermission } from '../model/useScheduleUpdatePermission'
import type { Schedule } from '../model/types'
import { CronEditDialogContent } from './CronEditDialogContent'
import { formatCronLabel } from './cronLabel'
import './CronCell.css'

type Props = {
    schedule: Schedule
    tooltipPlacement?: 'top' | 'bottom' | 'left' | 'right'
}

export const CronCell = memo(function CronCell({ schedule, tooltipPlacement }: Props) {
    const { t: tEntities, lang } = useI18n('entities')
    const dialog = useDialog()
    const canUpdate = useScheduleUpdatePermission()

    const open = () => {
        const id = dialog.open({
            content: (
                <CronEditDialogContent
                    schedulerId={schedule.schedulerId}
                    connectionTitle={schedule.connection.title}
                    onClose={() => dialog.closeById(id)}
                />
            ),
            width: 780,
            top: 72,
        })
    }

    if (schedule.cronExp) {
        const label = formatCronLabel(schedule.cronExp, tEntities, lang)
        const chipClass = `cron-cell__chip${label === schedule.cronExp.trim() ? '' : ' cron-cell__chip--text'}`
        if (!canUpdate) {
            return (
                <span className="cron-cell">
                    <Tooltip content={schedule.cronExp} placement={tooltipPlacement}>
                        <code className={`${chipClass} cron-cell__chip--readonly`}>{label}</code>
                    </Tooltip>
                </span>
            )
        }
        return (
            <span className="cron-cell">
                <Tooltip
                    content={`${schedule.cronExp} · ${tEntities('schedule.cronEdit.tooltip')}`}
                    placement={tooltipPlacement}
                >
                    <code className={chipClass} onClick={open}>
                        {label}
                    </code>
                </Tooltip>
            </span>
        )
    }

    if (!canUpdate) return null

    return (
        <span className="cron-cell">
            <Tooltip content={tEntities('schedule.cronEdit.tooltip')}>
                <IconButton
                    iconProps={{ name: 'edit', color: 'primary' }}
                    size="xs"
                    type="text"
                    onClick={open}
                />
            </Tooltip>
        </span>
    )
})
