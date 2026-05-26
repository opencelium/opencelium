import React, {useCallback} from 'react'
import {Input} from '@shared/ui/primitives/Input'
import {Switch} from '@shared/ui/primitives/Switch'
import type {ConfigValue} from '@entities/systemConfig/model/types'

type Props = {
    path: string
    value: ConfigValue
    onChange: (value: ConfigValue) => void
}

const SECRET_PATTERN = /password|secret|token|api[-_]?key/i

function isSecretPath(path: string): boolean {
    return SECRET_PATTERN.test(path)
}

export const ConfigLeafEditor: React.FC<Props> = ({path, value, onChange}) => {
    const handleStringChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value),
        [onChange],
    )

    const handleNumberChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const raw = e.target.value
            if (raw === '') {
                onChange(null)
                return
            }
            const parsed = Number(raw)
            onChange(Number.isFinite(parsed) ? parsed : raw)
        },
        [onChange],
    )

    if (typeof value === 'boolean') {
        return (
            <Switch
                checked={value}
                onChange={(checked) => onChange(checked)}
            />
        )
    }

    if (typeof value === 'number') {
        return (
            <Input
                type="number"
                value={String(value)}
                onChange={handleNumberChange}
                style={{maxWidth: 240}}
            />
        )
    }

    if (value === null) {
        return (
            <Input
                value=""
                placeholder="null"
                onChange={handleStringChange}
                style={{maxWidth: 360}}
            />
        )
    }

    if (typeof value === 'string') {
        return (
            <Input
                type={isSecretPath(path) ? 'password' : 'text'}
                value={value}
                onChange={handleStringChange}
                style={{maxWidth: 360}}
            />
        )
    }

    return null
}
