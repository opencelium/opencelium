import React, { useMemo } from 'react'
import AceEditor from 'react-ace'
import 'ace-builds/src-noconflict/mode-javascript'
import 'ace-builds/src-noconflict/theme-github'
import { useController, useFormContext, useWatch } from 'react-hook-form'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import type { Mode } from '@/engine/entity/EntityDefinition'
import { buildVarDeclarations, findOcArgNotExistMarkersInScript, SECTION1_HEADER, SECTION2_COMMENT } from '@entities/dataAggregator/lib/scriptUtils'
import type { DataAggregatorArg } from '@entities/dataAggregator/model/types'
import { EntityText } from '@shared/ui/primitives/Text'

interface DataAggregatorScriptEditorProps {
    name: string
    label?: string
    mode?: Mode
}

const panelStyle: React.CSSProperties = {
    border: '1px solid #d9d9d9',
    borderRadius: 4,
    overflow: 'hidden',
    width: '100%',
}

const panelHeaderStyle: React.CSSProperties = {
    background: '#f5f5f5',
    borderBottom: '1px solid #d9d9d9',
    padding: '2px 8px',
}

export function DataAggregatorScriptEditor({ name, label, mode }: DataAggregatorScriptEditorProps) {
    const { t } = useI18n('entities')
    const { control, formState: { errors } } = useFormContext()
    const { field } = useController({ name, control })
    const args = (useWatch({ name: 'args', control }) ?? []) as DataAggregatorArg[]

    const varDeclarations = useMemo(() => buildVarDeclarations(args), [args])

    const markers = useMemo(() =>
        findOcArgNotExistMarkersInScript((field.value as string) ?? '').map((m) => ({
            startRow: m.row,
            startCol: m.startCol,
            endRow: m.row,
            endCol: m.endCol,
            className: 'oc-script-arg-not-exist',
            type: 'text' as const,
            inFront: true,
        })),
    [field.value])

    const readOnly = mode === 'view'
    const translatedLabel = label ? t(label, { defaultValue: label }) : undefined
    const error = errors[name]?.message as string | undefined

    const varEditorHeight = `${Math.max(42, args.length * 14 + 8)}px`

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
            {translatedLabel && (
                <EntityText typoProps={{ isBold: true }} i18nKey={translatedLabel} />
            )}

            {/* Section 1: header comment as pre + var declarations in ace */}
            <div style={panelStyle}>
                <div style={panelHeaderStyle}>
                    <span style={{ fontSize: 11, color: '#888' }}>Auto-generated (read-only)</span>
                </div>
                <pre style={{
                    fontFamily: 'monospace',
                    fontSize: 12,
                    color: '#998',
                    margin: 0,
                    padding: '6px 4px 0 4px',
                    background: '#fff',
                    lineHeight: '14px',
                }}>
                    {SECTION1_HEADER}
                </pre>
                <AceEditor
                    mode="javascript"
                    theme="github"
                    value={varDeclarations}
                    readOnly={true}
                    name="ace_script_section1"
                    width="100%"
                    height={varEditorHeight}
                    fontSize={12}
                    setOptions={{ useWorker: false, showPrintMargin: false, highlightActiveLine: false }}
                />
            </div>

            {/* Section 2: SECTION2_COMMENT display + editable user script */}
            <style>{`.oc-script-arg-not-exist { position: absolute; background: rgba(255,77,79,0.35); }`}</style>
            <div style={panelStyle}>
                <div style={panelHeaderStyle}>
                    <span style={{ fontSize: 11, color: '#888' }}>Your script</span>
                </div>
                <pre style={{
                    fontFamily: 'monospace',
                    fontSize: 12,
                    color: '#998',
                    margin: 0,
                    padding: '6px 4px 0 4px',
                    background: '#fff',
                    lineHeight: '14px',
                }}>
                    {SECTION2_COMMENT}
                </pre>
                <AceEditor
                    mode="javascript"
                    theme="github"
                    onChange={field.onChange}
                    value={field.value ?? ''}
                    name={`ace_${name}`}
                    width="100%"
                    height="300px"
                    fontSize={12}
                    markers={markers}
                    setOptions={{ useWorker: false, showPrintMargin: false }}
                    readOnly={readOnly}
                />
            </div>

            {error && (
                <span style={{ color: '#ff4d4f', fontSize: 12 }}>
                    {t(error, { defaultValue: error })}
                </span>
            )}
        </div>
    )
}
