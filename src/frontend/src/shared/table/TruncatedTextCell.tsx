import React from 'react'
import { Tooltip } from '@shared/ui/primitives/Tooltip'
import { truncateCellText } from '@shared/ui/primitives/Table/Table.utils'

type Props = {
    value: unknown
}

/**
 * Free-text table cell: wraps across lines (unlike the table's default single-line
 * cell) but stays within the shared cell limits, with the untouched value on hover.
 * Use this from a column's `render` instead of a bare <div> — a custom render
 * returns JSX, which the table's own truncation can't rewrite.
 */
export const TruncatedTextCell: React.FC<Props> = ({ value }) => {
    const text = typeof value === 'string' ? value : ''
    if (!text) return null

    const shortened = truncateCellText(text)
    if (shortened === text) {
        return <div style={{ whiteSpace: 'normal' }}>{text}</div>
    }

    return (
        <Tooltip content={text}>
            <div style={{ whiteSpace: 'normal' }}>{shortened}</div>
        </Tooltip>
    )
}
