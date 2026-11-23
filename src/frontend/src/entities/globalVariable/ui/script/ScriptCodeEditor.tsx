import { useMemo } from 'react'
import AceEditor from 'react-ace'
import 'ace-builds/src-noconflict/mode-javascript'
import 'ace-builds/src-noconflict/mode-python'
import 'ace-builds/src-noconflict/mode-ruby'
import 'ace-builds/src-noconflict/theme-tomorrow'
import 'ace-builds/src-noconflict/theme-tomorrow_night'
import { FormControl } from '@shared/ui/form/FormControl'
import { useTheme } from '@shared/theme/hooks/useTheme'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import type { ImpureCall } from '../../model/script'
import type { ScriptLanguage, ValidateScriptResponse } from '../../model/types'

const ACE_MODE: Record<ScriptLanguage, string> = { js: 'javascript', python3: 'python', ruby: 'ruby' }

type Props = {
    language: ScriptLanguage
    code: string
    onChange: (code: string) => void
    isReadOnly: boolean
    impureCalls: ImpureCall[]
    result: ValidateScriptResponse | null
    error?: string
}

export function ScriptCodeEditor({ language, code, onChange, isReadOnly, impureCalls, result, error }: Props) {
    const { t } = useI18n('entities')
    const { themeMode } = useTheme()

    // Ace rows are 0-based; the backend and the analyser report 1-based lines.
    const annotations = useMemo(() => [
        ...impureCalls.map((call) => ({ row: call.line - 1, column: call.column - 1, type: 'error', text: t('global-variable.script.errors.SCRIPT_NOT_PURE') })),
        ...(result?.error?.line ? [{ row: result.error.line - 1, column: (result.error.column ?? 1) - 1, type: 'error', text: result.error.message }] : []),
    ], [impureCalls, result, t])

    return (
        <FormControl label="global-variable.script.code" error={error} hint="global-variable.script.codeHint" style={{ width: '100%' }}>
            <div data-testid="global-variable-script-code" style={{ width: '100%', border: '1px solid var(--color-border-default)', borderRadius: 6 }}>
                <AceEditor
                    mode={ACE_MODE[language]}
                    theme={themeMode === 'dark' ? 'tomorrow_night' : 'tomorrow'}
                    value={code}
                    onChange={onChange}
                    name="ace_global_variable_script"
                    width="100%"
                    minLines={10}
                    maxLines={30}
                    fontSize={13}
                    readOnly={isReadOnly}
                    annotations={annotations}
                    setOptions={{ useWorker: false, showPrintMargin: false, tabSize: 2 }}
                    editorProps={{ $blockScrolling: true }}
                />
            </div>
        </FormControl>
    )
}
