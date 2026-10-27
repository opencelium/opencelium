/**
 * Field rules are the plan's "<Operation>, <Operation> set <field> = <value>" lines. A value of `script: …` asks for a
 * transformation; anything else (`item title`, `"Production"`) is a plain value.
 */
export type FieldRule = {
    field: string
    isScript: boolean
    /** The value as the plan words it, e.g. `script: "Operational" when …`. */
    value: string
}

export type FieldRuleLine = {
    /** Operations the line names; when it names none, `create`/`update` words pick methods by name. */
    operations: string[]
    words: { create: boolean; update: boolean }
    rules: FieldRule[]
}

const SET_RE = /\bsets?\b\s*:?\s*(.+)$/i
// Split "a = x, b = y; c = z" on separators that start a new "<field> =".
const SEGMENT_SPLIT_RE = /\s*[;,]\s*(?=[\w.[\]]+\s*=)/
const SEGMENT_RE = /^([\w.[\]]+)\s*=\s*(.+?)\s*\.?$/

export function parseFieldRuleLine(text: string, operations: string[]): FieldRuleLine | undefined {
    const match = SET_RE.exec(text)
    if (!match?.[1]) return undefined
    const rules = match[1].split(SEGMENT_SPLIT_RE).flatMap((segment): FieldRule[] => {
        const parts = SEGMENT_RE.exec(segment.trim())
        if (!parts?.[1] || !parts[2]) return []
        return [{ field: parts[1], value: parts[2], isScript: /^(a\s+)?script\b/i.test(parts[2]) }]
    })
    if (rules.length === 0) return undefined
    // Only what comes before "set" says whose fields these are; operations named in the values are their sources.
    const head = text.slice(0, match.index)
    const owners = operations.filter((operation) => head.includes(operation))
    const words = head.toLowerCase()
    return { operations: owners, words: { create: /\bcreate\b/.test(words), update: /\bupdate\b/.test(words) }, rules }
}

/** Whether a rule line is about a method: it names the operation, or (naming none) says create/update and the name does. */
export function ruleAppliesTo(line: FieldRuleLine, operation: string): boolean {
    if (line.operations.length > 0) return line.operations.includes(operation)
    const name = operation.toLowerCase()
    return (line.words.create && name.includes('create')) || (line.words.update && name.includes('update'))
}
