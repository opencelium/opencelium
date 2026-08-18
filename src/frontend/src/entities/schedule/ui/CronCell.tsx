import { memo } from 'react'
import { IconButton } from '@shared/ui/primitives/IconButton'
import { Tooltip } from '@shared/ui/primitives/Tooltip'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { useDialog } from '@shared/ui/dialog/useDialog'
import { useScheduleUpdatePermission } from '../model/useScheduleUpdatePermission'
import type { Schedule } from '../model/types'
import { CronEditDialogContent } from './CronEditDialogContent'
import './CronCell.css'

type Props = {
    schedule: Schedule
    tooltipPlacement?: 'top' | 'bottom' | 'left' | 'right'
}

export const CronCell = memo(function CronCell({ schedule, tooltipPlacement }: Props) {
    const { t: tEntities } = useI18n('entities')
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
            width: 720,
        })
    }

    if (schedule.cronExp) {
        if (!canUpdate) {
            return (
                <span className="cron-cell">
                    <code className="cron-cell__chip cron-cell__chip--readonly">{schedule.cronExp}</code>
                </span>
            )
        }
        return (
            <span className="cron-cell">
                <Tooltip content={tEntities('schedule.cronEdit.tooltip')} placement={tooltipPlacement}>
                    <code className="cron-cell__chip" onClick={open}>
                        {schedule.cronExp}
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
