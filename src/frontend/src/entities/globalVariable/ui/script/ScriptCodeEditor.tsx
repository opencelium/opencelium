import { useMemo } from 'react'
import AceEditor from 'react-ace'
import 'ace-builds/src-noconflict/mode-javascript'
import 'ace-builds/src-noconflict/theme-tomorrow'
import 'ace-builds/src-noconflict/theme-tomorrow_night'
import { FormControl } from '@shared/ui/form/FormControl'
import { useTheme } from '@shared/theme/hooks/useTheme'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import type { DetectedRef, RefIssue } from '../../model/script'
import type { ValidateScriptResponse } from '../../model/types'

const REF_MARKER_CLASS = 'oc-script-ref-marker'

type Props = {
    code: string
    onChange: (code: string) => void
    isReadOnly: boolean
    refs: DetectedRef[]
    nonLiteral: RefIssue[]
    result: ValidateScriptResponse | null
    error?: string
}

export function ScriptCodeEditor({ code, onChange, isReadOnly, refs, nonLiteral, result, error }: Props) {
    const { t } = useI18n('entities')
    const { themeMode } = useTheme()

    const markers = useMemo(() => refs.map((ref) => ({
        startRow: ref.line - 1, startCol: ref.column - 1, endRow: ref.line - 1, endCol: ref.column - 1 + ref.length,
        className: REF_MARKER_CLASS, type: 'text' as const, inFront: false,
    })), [refs])

    // Ace rows are 0-based; the backend and the analyser report 1-based lines.
    const annotations = useMemo(() => [
        ...nonLiteral.map((issue) => ({ row: issue.line - 1, column: issue.column - 1, type: 'error', text: t('global-variable.script.errors.REF_NOT_LITERAL') })),
        ...refs.filter((ref) => ref.warning).map((ref) => ({ row: ref.line - 1, column: ref.column - 1, type: 'warning', text: t('global-variable.script.warnings.TIED_TO_CALLER_COLORS') })),
        ...(result?.error?.line ? [{ row: result.error.line - 1, column: (result.error.column ?? 1) - 1, type: 'error', text: result.error.message }] : []),
    ], [nonLiteral, refs, result, t])

    return (
        <FormControl label="global-variable.script.code" error={error} hint="global-variable.script.codeHint" style={{ width: '100%' }}>
            <style>{`.${REF_MARKER_CLASS} { position: absolute; background: var(--color-status-info-bg); border-bottom: 1px solid var(--color-status-info-border); }`}</style>
            <div data-testid="global-variable-script-code" style={{ width: '100%', border: '1px solid var(--color-border-default)', borderRadius: 6 }}>
                <AceEditor
                    mode="javascript"
                    theme={themeMode === 'dark' ? 'tomorrow_night' : 'tomorrow'}
                    value={code}
                    onChange={onChange}
                    name="ace_global_variable_script"
                    width="100%"
                    minLines={10}
                    maxLines={30}
                    fontSize={13}
                    readOnly={isReadOnly}
                    markers={markers}
                    annotations={annotations}
                    setOptions={{ useWorker: false, showPrintMargin: false, tabSize: 2 }}
                    editorProps={{ $blockScrolling: true }}
                />
            </div>
        </FormControl>
    )
}
