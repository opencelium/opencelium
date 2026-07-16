import React, { useEffect, useMemo, useRef, useState } from 'react'
import AceEditor from 'react-ace'
import type { Ace } from 'ace-builds'
import 'ace-builds/src-noconflict/mode-javascript'
import 'ace-builds/src-noconflict/theme-tomorrow'
import 'ace-builds/src-noconflict/theme-tomorrow_night'
import 'ace-builds/src-noconflict/ext-language_tools'
import { useController, useFormContext, useWatch } from 'react-hook-form'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { useTheme } from '@shared/theme/hooks/useTheme'
import type { Mode } from '@/engine/entity/EntityDefinition'
import { buildVarDeclarations, findOcArgNotExistMarkersInScript, SECTION1_HEADER, SECTION2_COMMENT } from '@entities/dataAggregator/lib/scriptUtils'
import type { DataAggregatorArg } from '@entities/dataAggregator/model/types'
import { EntityText } from '@shared/ui/primitives/Text'
import { Collapse } from '@shared/ui/primitives/Collapse'
import { IconButton } from '@shared/ui/primitives/IconButton'
import { Tooltip } from '@shared/ui/primitives/Tooltip'

interface DataAggregatorScriptEditorProps {
    name: string
    label?: string
    mode?: Mode
}

type AceCompletion = { caption: string; value: string; meta: string; score: number }
type AceCompleter = {
    getCompletions: (
        editor: Ace.Editor,
        session: Ace.EditSession,
        pos: Ace.Point,
        prefix: string,
        callback: (error: unknown, completions: AceCompletion[]) => void,
    ) => void
}
type EditorWithCompleters = Ace.Editor & { completers?: AceCompleter[] }

const panelStyle: React.CSSProperties = {
    border: '1px solid var(--color-border-default)',
    borderRadius: 4,
    overflow: 'hidden',
    width: '100%',
}

const panelHeaderStyle: React.CSSProperties = {
    background: 'var(--color-background-hover)',
    borderBottom: '1px solid var(--color-border-default)',
    padding: '2px 8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
}

export function DataAggregatorScriptEditor({ name, label, mode }: DataAggregatorScriptEditorProps) {
    const { t } = useI18n('entities')
    const { themeMode } = useTheme()
    const aceTheme = themeMode === 'dark' ? 'tomorrow_night' : 'tomorrow'
    const { control, formState: { errors } } = useFormContext()
    const { field } = useController({ name, control })
    const watchedArgs = useWatch({ name: 'args', control })
    const args = useMemo(() => (watchedArgs ?? []) as DataAggregatorArg[], [watchedArgs])

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

    // Kept fresh via a ref so the completer (registered once, on editor mount)
    // always sees the current args instead of the ones captured at mount time.
    const argsRef = useRef(args)
    useEffect(() => {
        argsRef.current = args
    }, [args])

    const handleScriptEditorLoad = (editor: Ace.Editor) => {
        const variableCompleter: AceCompleter = {
            getCompletions: (_editor, _session, _pos, _prefix, callback) => {
                callback(null, argsRef.current.map((arg) => ({
                    caption: arg.name,
                    value: arg.name,
                    meta: 'variable',
                    score: 1000,
                })))
            },
        }
        const editorWithCompleters = editor as EditorWithCompleters
        editorWithCompleters.completers = [...(editorWithCompleters.completers ?? []), variableCompleter]
    }

    // Expands the "Your script" panel to cover the full viewport, regardless of
    // whether it's embedded in a dialog or the standalone entity page.
    const [isScriptMaximized, setIsScriptMaximized] = useState(false)

    const toggleScriptMaximized = () => {
        setIsScriptMaximized((prev) => !prev)
        // Ace only re-measures its viewport on a window resize event.
        setTimeout(() => window.dispatchEvent(new Event('resize')), 0)
    }

    const varEditorHeight = `${Math.max(42, args.length * 14 + 8)}px`

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
            {translatedLabel && (
                <EntityText typoProps={{ isBold: true }} i18nKey={translatedLabel} />
            )}

            {/* Section 1: header comment as pre + var declarations in ace, collapsible, closed by default */}
            <Collapse
                defaultActiveKeys={[]}
                items={[
                    {
                        key: 'section1',
                        label: <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Auto-generated (read-only)</span>,
                        content: (
                            <>
                                <pre style={{
                                    fontFamily: 'monospace',
                                    fontSize: 12,
                                    color: 'var(--color-text-secondary)',
                                    margin: 0,
                                    padding: '0 4px 6px 4px',
                                    background: 'var(--color-background-surface)',
                                    lineHeight: '14px',
                                }}>
                                    {SECTION1_HEADER}
                                </pre>
                                <AceEditor
                                    mode="javascript"
                                    theme={aceTheme}
                                    value={varDeclarations}
                                    readOnly={true}
                                    name="ace_script_section1"
                                    width="100%"
                                    height={varEditorHeight}
                                    fontSize={12}
                                    setOptions={{ useWorker: false, showPrintMargin: false, highlightActiveLine: false }}
                                />
                            </>
                        ),
                    },
                ]}
            />

            {/* Section 2: SECTION2_COMMENT display + editable user script */}
            <style>{`.oc-script-arg-not-exist { position: absolute; background: rgba(255,77,79,0.35); }`}</style>
            <div
                style={
                    isScriptMaximized
                        ? {
                            ...panelStyle,
                            position: 'fixed',
                            inset: 0,
                            zIndex: 1100,
                            display: 'flex',
                            flexDirection: 'column',
                            background: 'var(--color-background-surface)',
                            padding: 8,
                        }
                        : panelStyle
                }
            >
                <div style={panelHeaderStyle}>
                    <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Your script</span>
                    <Tooltip content={t(isScriptMaximized ? 'data-aggregator.scriptEditor.minimize' : 'data-aggregator.scriptEditor.maximize')}>
                        <IconButton
                            iconProps={{ name: isScriptMaximized ? 'minimize' : 'maximize' }}
                            size="xs"
                            type="text"
                            onClick={toggleScriptMaximized}
                            testId="data-aggregator-script-toggle-maximize"
                        />
                    </Tooltip>
                </div>
                <pre style={{
                    fontFamily: 'monospace',
                    fontSize: 12,
                    color: 'var(--color-text-secondary)',
                    margin: 0,
                    padding: '6px 4px 0 4px',
                    background: 'var(--color-background-surface)',
                    lineHeight: '14px',
                }}>
                    {SECTION2_COMMENT}
                </pre>
                <div style={isScriptMaximized ? { flex: 1, minHeight: 0 } : undefined}>
                    <AceEditor
                        mode="javascript"
                        theme={aceTheme}
                        onChange={field.onChange}
                        onLoad={handleScriptEditorLoad}
                        value={field.value ?? ''}
                        name={`ace_${name}`}
                        width="100%"
                        height={isScriptMaximized ? '100%' : '300px'}
                        fontSize={12}
                        markers={markers}
                        setOptions={{
                            useWorker: false,
                            showPrintMargin: false,
                            enableBasicAutocompletion: true,
                            enableLiveAutocompletion: true,
                        }}
                        readOnly={readOnly}
                    />
                </div>
            </div>

            {error && (
                <span style={{ color: 'var(--color-status-error-fg)', fontSize: 12 }}>
                    {t(error, { defaultValue: error })}
                </span>
            )}
        </div>
    )
}
