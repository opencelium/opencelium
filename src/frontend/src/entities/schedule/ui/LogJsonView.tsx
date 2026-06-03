import React from 'react'
import ReactJson from 'react-json-view'
import { useTheme } from '@shared/theme/hooks/useTheme'
import { ThemeName } from '@shared/theme/types'

type Props = {
    data: object
    name?: string | false
    minHeight?: number
}

// react-json-view ships React 17 typings; the project already casts it to a
// permissive component type to use it under React 19 (see LegacyRequestJsonEditor).
const Json = ReactJson as unknown as React.ComponentType<Record<string, unknown>>

export function LogJsonView({ data, name = false, minHeight = 96 }: Props) {
    const { themeName } = useTheme()

    return (
        <div
            style={{
                minHeight,
                maxHeight: 220,
                padding: '8px 12px',
                border: '1px solid var(--color-border-default)',
                borderRadius: 6,
                overflow: 'auto',
            }}
        >
            <Json
                name={name}
                src={data}
                collapsed={false}
                enableClipboard={false}
                displayDataTypes={false}
                displayObjectSize={false}
                theme={themeName === ThemeName.Dark ? 'twilight' : 'rjv-default'}
                style={{
                    background: 'transparent',
                    fontSize: 13,
                    wordBreak: 'break-word',
                }}
            />
        </div>
    )
}
