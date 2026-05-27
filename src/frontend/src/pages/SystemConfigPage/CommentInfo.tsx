import React from 'react'
import {Tooltip} from '@shared/ui/primitives/Tooltip'
import {Icon} from '@shared/ui/primitives/Icon'

type DisplayComment = {position: string; text: string}

const POSITION_ORDER: Record<string, number> = {
    header: 0,
    before: 1,
    inline: 2,
    after: 3,
    footer: 4,
}

function formatComment(text: string): string {
    return text.split('\n').map((line) => `#${line}`).join('\n')
}

function sortComments(comments: DisplayComment[]): DisplayComment[] {
    return [...comments].sort(
        (a, b) => (POSITION_ORDER[a.position] ?? 99) - (POSITION_ORDER[b.position] ?? 99),
    )
}

export function CommentTooltipBody({comments}: {comments: DisplayComment[]}) {
    const sorted = sortComments(comments)
    return (
        <div style={{maxWidth: 520, maxHeight: 360, overflow: 'auto'}}>
            {sorted.map((c, idx) => (
                <pre
                    key={idx}
                    style={{
                        margin: idx === 0 ? 0 : '8px 0 0',
                        fontFamily: 'var(--font-mono, monospace)',
                        fontSize: 12,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                    }}
                >
                    {formatComment(c.text)}
                </pre>
            ))}
        </div>
    )
}

export function CommentInfo({comments}: {comments?: DisplayComment[]}) {
    if (!comments || comments.length === 0) return null
    return (
        <Tooltip content={<CommentTooltipBody comments={comments} />} placement="left">
            <span style={{display: 'inline-flex', alignItems: 'center', marginLeft: 'auto', cursor: 'help', marginRight: 10}}>
                <Icon name="info" size={14} color="secondary" isSubtle />
            </span>
        </Tooltip>
    )
}
