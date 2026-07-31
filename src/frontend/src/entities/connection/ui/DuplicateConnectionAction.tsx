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

    // Host the dialog in the global stack rather than local state, so it
    // survives even if this row-action component itself unmounts.
    const open = () => {
        dialog.open({
            title: tEntities('connection.list.duplicate.dialogTitle'),
            width: 480,
            testId: 'connection-duplicate-dialog',
            content: <DuplicateConnectionForm row={row} onClose={dialog.close} />,
        })
    }

    return (
        <Tooltip content={tEntities('connection.list.duplicate.tooltip')} placement="top">
            <IconButton
                iconProps={{ name: 'content-copy', color: 'primary', size: 15 }}
                type={'text'}
                size={'xs'}
                onClick={open}
                testId="connection-duplicate-trigger"
            />
        </Tooltip>
    )
}
