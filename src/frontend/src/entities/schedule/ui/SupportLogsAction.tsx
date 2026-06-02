import { IconButton } from '@shared/ui/primitives/IconButton'
import { Tooltip } from '@shared/ui/primitives/Tooltip'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { useDialog } from '@shared/ui/dialog/useDialog'
import type { Schedule } from '../model/types'
import { SupportLogsDialogContent } from './SupportLogsDialogContent'

type Props = {
    schedule: Schedule
}

export function SupportLogsAction({ schedule }: Props) {
    const { t: tEntities } = useI18n('entities')
    const dialog = useDialog()

    const open = () => {
        dialog.open({
            content: (
                <SupportLogsDialogContent
                    connectionId={schedule.connection.connectionId}
                    connectionTitle={schedule.connection.title}
                    onClose={() => dialog.close()}
                />
            ),
            width: 720,
        })
    }

    return (
        <Tooltip content={tEntities('schedule.supportLogs.tooltip')}>
            <IconButton
                iconProps={{ name: 'journal-text', color: 'primary' }}
                size="xs"
                type="text"
                onClick={open}
            />
        </Tooltip>
    )
}
