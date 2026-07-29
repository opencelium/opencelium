import React from 'react'
import { Tooltip } from '@shared/ui/primitives/Tooltip'
import type { ConnectionVersionResource } from '@features/workflow/types/history.types'

type Props = {
    lastVersion: ConnectionVersionResource | null | undefined
}

export const SnapshotIdCell: React.FC<Props> = ({ lastVersion }) => {
    if (!lastVersion?.snapshotId) return null

    return (
        <Tooltip content={lastVersion.comment ?? ''}>
            <span>{lastVersion.snapshotId}</span>
        </Tooltip>
    )
}
