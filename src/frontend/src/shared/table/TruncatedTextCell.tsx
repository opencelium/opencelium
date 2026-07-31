import React from 'react'
import { Tooltip } from '@shared/ui/primitives/Tooltip'

const MAX_LENGTH = 150

type Props = {
    value: unknown
}

export const TruncatedTextCell: React.FC<Props> = ({ value }) => {
    const text = typeof value === 'string' ? value : ''
    if (!text) return null

    if (text.length <= MAX_LENGTH) {
        return <div style={{ whiteSpace: 'normal' }}>{text}</div>
    }

    return (
        <Tooltip content={text}>
            <div style={{ whiteSpace: 'normal' }}>{text.slice(0, MAX_LENGTH)}...</div>
        </Tooltip>
    )
}
