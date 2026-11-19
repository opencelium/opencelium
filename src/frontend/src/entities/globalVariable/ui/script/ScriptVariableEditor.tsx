import { useMemo } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import type { Mode } from '@/engine/entity/EntityDefinition'
import { FormControl } from '@shared/ui/form/FormControl'
import { Select } from '@shared/ui/primitives/Select'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { detectRefs, emptyScript, SCRIPT_LANGUAGES, uniqueRefs, type ScriptFormValues } from '../../model/script'
import type { ScriptLanguage } from '../../model/types'
import { ScriptCodeEditor } from './ScriptCodeEditor'
import { ScriptImportsSelect } from './ScriptImportsSelect'
import { ScriptParametersEditor } from './ScriptParametersEditor'
import { ScriptRefsList } from './ScriptRefsList'
import { ScriptTestRun } from './ScriptTestRun'
import { useScriptTestRun } from './useScriptTestRun'

export function ScriptVariableEditor({ mode }: { mode: Mode }) {
    const { t } = useI18n('entities')
    const { control, setValue, getFieldState, formState } = useFormContext()
    const script = (useWatch({ control, name: 'script' }) as ScriptFormValues | undefined) ?? emptyScript()
    const ownName = String(useWatch({ control, name: 'name' }) ?? '')
    const isReadOnly = mode === 'view'
    const detected = useMemo(() => detectRefs(script.code), [script.code])
    const refs = useMemo(() => uniqueRefs(detected.refs), [detected])
    const testRun = useScriptTestRun(script, refs)

    const update = (patch: Partial<ScriptFormValues>) => {
        setValue('script', { ...script, ...patch }, { shouldDirty: true, shouldValidate: formState.isSubmitted })
        if (patch.code !== undefined || patch.parameters !== undefined) testRun.clearResult()
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }} data-testid="global-variable-script-editor">
            <FormControl label="global-variable.script.language"
                hint={mode === 'create' ? undefined : 'global-variable.script.languageLocked'} style={{ width: '100%' }}>
                <Select
                    value={script.language}
                    options={SCRIPT_LANGUAGES.map((language) => ({ value: language, label: t(`global-variable.script.languages.${language}`) }))}
                    onChange={(language) => update({ language: language as ScriptLanguage, imports: [] })}
                    disabled={isReadOnly || mode !== 'create'}
                    testId="global-variable-script-language"
                />
            </FormControl>
            <ScriptParametersEditor parameters={script.parameters} isReadOnly={isReadOnly}
                onChange={(parameters) => update({ parameters })}
                error={getFieldState('script.parameters', formState).error?.message} />
            <ScriptImportsSelect value={script.imports} language={script.language} ownName={ownName}
                isReadOnly={isReadOnly} onChange={(imports) => update({ imports })} />
            <ScriptCodeEditor code={script.code} onChange={(code) => update({ code })} isReadOnly={isReadOnly}
                refs={detected.refs} nonLiteral={detected.nonLiteral} result={testRun.result}
                error={getFieldState('script.code', formState).error?.message} />
            <ScriptRefsList refs={refs} />
            {!isReadOnly && <ScriptTestRun parameters={script.parameters} refs={refs} testRun={testRun} />}
        </div>
    )
}
