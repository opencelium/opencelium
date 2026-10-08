import React from 'react'
import { Tooltip } from '@shared/ui/primitives/Tooltip'
import { truncateCellText } from '@shared/ui/primitives/Table/Table.utils'

type Props = {
    value: unknown
    /**
     * Let the text break inside a word. `overflow-wrap: anywhere` — not the older
     * `break-word` — because only `anywhere` also shrinks the element's min-content
     * width, which is what lets the column narrow past its longest token. Set it for
     * columns carrying URLs, ids or stack traces: a 50-character unbreakable run is
     * otherwise a 350px floor on the column, and the table scrolls sideways to honour
     * it however little text surrounds it.
     */
    breakAnywhere?: boolean
}

/**
 * Free-text table cell: wraps across lines (unlike the table's default single-line
 * cell) but stays within the shared cell limits, with the untouched value on hover.
 * Use this from a column's `render` instead of a bare <div> — a custom render
 * returns JSX, which the table's own truncation can't rewrite.
 */
export const TruncatedTextCell: React.FC<Props> = ({ value, breakAnywhere }) => {
    const text = typeof value === 'string' ? value : ''
    if (!text) return null

    const style: React.CSSProperties = {
        whiteSpace: 'normal',
        ...(breakAnywhere ? { overflowWrap: 'anywhere' } : {}),
    }

    const shortened = truncateCellText(text)
    if (shortened === text) {
        return <div style={style}>{text}</div>
    }

    return (
        <Tooltip content={text}>
            <div style={style}>{shortened}</div>
        </Tooltip>
    )
}
