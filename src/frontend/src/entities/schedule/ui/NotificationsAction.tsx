import { Button } from '@shared/ui/primitives/Button'
import { IconButton } from '@shared/ui/primitives/IconButton'
import { Tooltip } from '@shared/ui/primitives/Tooltip'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { useDialog } from '@shared/ui/dialog/useDialog'
import type { Schedule } from '../model/types'
import { NotificationsDialogContent } from './NotificationsDialogContent'

type Props = {
    schedule: Schedule
    tooltipPlacement?: 'top' | 'bottom' | 'left' | 'right'
}

export function NotificationsAction({ schedule, tooltipPlacement }: Props) {
    const { t: tEntities } = useI18n('entities')
    const dialog = useDialog()

    const open = () => {
        dialog.open({
            content: <NotificationsDialogContent schedulerId={schedule.schedulerId} />,
            footer: (
                <Button onClick={() => dialog.close()}>
                    {tEntities('schedule.notifications.close')}
                </Button>
            ),
            width: 1000,
            top: 18,
        })
    }

    return (
        <Tooltip content={tEntities('schedule.notifications.tooltip')} placement={tooltipPlacement}>
            <IconButton
                iconProps={{ name: 'notification', color: 'primary' }}
                size="xs"
                type="text"
                onClick={open}
            />
        </Tooltip>
    )
}
