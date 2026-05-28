import React, {useCallback, useEffect, useRef, useState} from 'react'
import {Input} from '@shared/ui/primitives/Input'
import {Switch} from '@shared/ui/primitives/Switch'
import type {ConfigScalar} from '@entities/systemConfig/model/types'

type LeafValue = ConfigScalar | ConfigScalar[]

type Props = {
    path: string
    value: LeafValue
    onChange: (value: LeafValue) => void
}

const SECRET_PATTERN = /password|secret|token|api[-_]?key/i

function isSecretPath(path: string): boolean {
    return SECRET_PATTERN.test(path)
}

function valueToText(value: LeafValue): string {
    if (value === null) return ''
    if (Array.isArray(value)) return JSON.stringify(value)
    return String(value)
}

/**
 * Scalar/array input with a local draft. Typing only updates local state — the
 * shared config tree is rebuilt once, on blur, instead of on every keystroke.
 * The committed `value` prop re-syncs the draft when it changes externally.
 */
const TextLikeInput: React.FC<Props & {kind: 'number' | 'string' | 'array' | 'null'}> = ({
    path,
    value,
    onChange,
    kind,
}) => {
    const external = valueToText(value)
    const [draft, setDraft] = useState(external)

    useEffect(() => {
        setDraft(external)
    }, [external])

    const commit = useCallback(() => {
        if (draft === external) return
        if (kind === 'number') {
            if (draft.trim() === '') {
                onChange(null)
                return
            }
            const parsed = Number(draft)
            onChange(Number.isFinite(parsed) ? parsed : draft)
            return
        }
        if (kind === 'array') {
            try {
                const parsed = JSON.parse(draft)
                if (Array.isArray(parsed)) {
                    onChange(parsed as ConfigScalar[])
                    return
                }
            } catch {
                // fall through — keep raw text as a string value
            }
            onChange(draft)
            return
        }
        onChange(draft)
    }, [draft, external, kind, onChange])

    // Flush a pending edit if the row unmounts before blur (e.g. scrolled out of
    // the virtualized viewport). The page itself stays mounted, so this is safe.
    const commitRef = useRef(commit)
    commitRef.current = commit
    useEffect(() => () => commitRef.current(), [])

    return (
        <Input
            type={kind === 'number' ? 'number' : kind === 'string' && isSecretPath(path) ? 'password' : 'text'}
            value={draft}
            placeholder={kind === 'null' ? 'null' : undefined}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            style={{width: kind === 'number' ? 140 : 320, flexShrink: 0}}
        />
    )
}

export const ConfigLeafEditor: React.FC<Props> = ({path, value, onChange}) => {
    if (typeof value === 'boolean') {
        return <Switch checked={value} onChange={(checked) => onChange(checked)} />
    }
    if (Array.isArray(value)) {
        return <TextLikeInput path={path} value={value} onChange={onChange} kind="array" />
    }
    if (typeof value === 'number') {
        return <TextLikeInput path={path} value={value} onChange={onChange} kind="number" />
    }
    if (value === null) {
        return <TextLikeInput path={path} value={value} onChange={onChange} kind="null" />
    }
    return <TextLikeInput path={path} value={value} onChange={onChange} kind="string" />
}
