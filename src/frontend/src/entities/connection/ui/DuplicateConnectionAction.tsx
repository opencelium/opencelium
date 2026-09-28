import React from 'react'
import { IconButton } from '@shared/ui/primitives/IconButton'
import { Tooltip } from '@shared/ui/primitives/Tooltip'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { useDuplicateConnection } from '@entities/connection/ui/useDuplicateConnection'
import type { Connection } from '@entities/connection/model/types'

type Props = {
    row: Connection
}

export const DuplicateConnectionAction: React.FC<Props> = ({ row }) => {
    const { t: tEntities } = useI18n('entities')
    const { duplicate, isDuplicating } = useDuplicateConnection(row)

    return (
        <Tooltip content={tEntities('connection.list.duplicate.tooltip')} placement="top">
            <IconButton
                iconProps={{ name: 'content-copy', color: 'primary', size: 15 }}
                type={'text'}
                size={'xs'}
                loading={isDuplicating}
                onClick={duplicate}
                testId="connection-duplicate-trigger"
            />
        </Tooltip>
    )
}
