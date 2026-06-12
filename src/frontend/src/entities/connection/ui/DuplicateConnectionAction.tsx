import React from 'react'
import { IconButton } from '@shared/ui/primitives/IconButton'
import { Tooltip } from '@shared/ui/primitives/Tooltip'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { useDialogController } from '@shared/ui/dialog/DialogContext'
import { DuplicateConnectionForm } from '@entities/connection/ui/DuplicateConnectionForm'
import type { Connection } from '@entities/connection/model/types'

type Props = {
    row: Connection
}

export const DuplicateConnectionAction: React.FC<Props> = ({ row }) => {
    const { t: tEntities } = useI18n('entities')
    const dialog = useDialogController()

    // The action lives inside the row's antd Popover, which unmounts its content
    // on close. Host the dialog in the global stack so it survives the popover.
    const open = () => {
        dialog.open({
            title: tEntities('connection.list.duplicate.dialogTitle'),
            width: 480,
            content: <DuplicateConnectionForm row={row} onClose={dialog.close} />,
        })
    }

    return (
        <Tooltip content={tEntities('connection.list.duplicate.tooltip')} placement="right">
            <IconButton
                iconProps={{ name: 'content-copy', color: 'primary' }}
                type={'text'}
                size={'xs'}
                onClick={open}
            />
        </Tooltip>
    )
}
