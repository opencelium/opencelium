import { findGlobalReferences } from '../../lib/globalReference'
import { GlobalReferenceChip } from './GlobalReferenceChip'

type Part = { kind: 'text'; text: string } | { kind: 'global'; reference: string }

type Props = {
    text: string
    /** For a password field: plain text becomes dots and constants keep their name, not their value. */
    isMasked?: boolean
}

const splitParts = (text: string): Part[] => {
    const parts: Part[] = []
    let cursor = 0
    findGlobalReferences(text).forEach((reference) => {
        if (reference.start > cursor) parts.push({ kind: 'text', text: text.slice(cursor, reference.start) })
        parts.push({ kind: 'global', reference: reference.raw })
        cursor = reference.end
    })
    if (cursor < text.length) parts.push({ kind: 'text', text: text.slice(cursor) })
    return parts
}

/** A text value with its `{{global.x}}` references drawn as chips, for display only. */
export function GlobalTextPreview({ text, isMasked = false }: Props) {
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, minWidth: 0, overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {splitParts(text).map((part, index) => part.kind === 'text'
                ? <span key={index}>{isMasked ? '•'.repeat(part.text.length) : part.text}</span>
                : <GlobalReferenceChip key={index} reference={part.reference} showsConstantValue={!isMasked} />)}
        </span>
    )
}
