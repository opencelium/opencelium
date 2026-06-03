import { memo } from 'react'
import { IconButton } from '@shared/ui/primitives/IconButton'
import { Tooltip } from '@shared/ui/primitives/Tooltip'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { useDialog } from '@shared/ui/dialog/useDialog'
import type { Schedule } from '../model/types'
import { CronEditDialogContent } from './CronEditDialogContent'
import './CronCell.css'

type Props = {
    schedule: Schedule
}

export const CronCell = memo(function CronCell({ schedule }: Props) {
    const { t: tEntities } = useI18n('entities')
    const dialog = useDialog()

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
        return (
            <span className="cron-cell">
                <Tooltip content={tEntities('schedule.cronEdit.tooltip')}>
                    <code className="cron-cell__chip" onClick={open}>
                        {schedule.cronExp}
                    </code>
                </Tooltip>
            </span>
        )
    }

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
