import React from 'react'
import { Tooltip } from '@shared/ui/primitives/Tooltip'
import type { ConnectionVersionResource } from '@features/workflow/types/history.types'

const MAX_COMMENT_LENGTH = 100

type Props = {
    lastVersion: ConnectionVersionResource | null | undefined
}

export const CurrentVersionCell: React.FC<Props> = ({ lastVersion }) => {
    const comment = lastVersion?.comment
    if (!comment) return null

    const truncated = comment.length > MAX_COMMENT_LENGTH ? `${comment.slice(0, MAX_COMMENT_LENGTH)}...` : comment

    return (
        <Tooltip content={comment}>
            <span style={{whiteSpace: 'normal'}}>{truncated}</span>
        </Tooltip>
    )
}
