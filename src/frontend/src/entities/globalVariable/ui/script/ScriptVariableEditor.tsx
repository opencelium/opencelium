import { useMemo, useState } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import type { Mode } from '@/engine/entity/EntityDefinition'
import { FormControl } from '@shared/ui/form/FormControl'
import { Select } from '@shared/ui/primitives/Select'
import { Tabs } from '@shared/ui/primitives/Tabs'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { DEFAULT_CODE, detectImpureCalls, emptyScript, SCRIPT_LANGUAGES, type ScriptFormValues } from '../../model/script'
import type { ScriptLanguage } from '../../model/types'
import { ScriptCodeEditor } from './ScriptCodeEditor'
import { ScriptParametersEditor } from './ScriptParametersEditor'
import { ScriptTestRun } from './ScriptTestRun'
import { useScriptTestRun } from './useScriptTestRun'

export function ScriptVariableEditor({ mode }: { mode: Mode }) {
    const { t } = useI18n('entities')
    const { control, setValue, getFieldState, formState } = useFormContext()
    const script = (useWatch({ control, name: 'script' }) as ScriptFormValues | undefined) ?? emptyScript()
    const isReadOnly = mode === 'view'
    const impureCalls = useMemo(() => detectImpureCalls(script.code, script.language), [script.code, script.language])
    const testRun = useScriptTestRun(script)
    const [tab, setTab] = useState('define')

    const update = (patch: Partial<ScriptFormValues>) => {
        setValue('script', { ...script, ...patch }, { shouldDirty: true, shouldValidate: formState.isSubmitted })
        if (patch.code !== undefined || patch.parameters !== undefined) testRun.clearResult()
    }

    const definition = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
            <FormControl label="global-variable.script.language"
                hint={mode === 'create' ? undefined : 'global-variable.script.languageLocked'} style={{ width: '100%' }}>
                <Select
                    value={script.language}
                    options={SCRIPT_LANGUAGES.map((language) => ({ value: language, label: t(`global-variable.script.languages.${language}`) }))}
                    onChange={(language) => update({
                        language: language as ScriptLanguage,
                        // Untouched starter code follows the language; anything typed is kept.
                        ...(script.code === DEFAULT_CODE[script.language] ? { code: DEFAULT_CODE[language as ScriptLanguage] } : {}),
                    })}
                    disabled={isReadOnly || mode !== 'create'}
                    testId="global-variable-script-language"
                />
            </FormControl>
            <ScriptParametersEditor parameters={script.parameters} isReadOnly={isReadOnly}
                onChange={(parameters) => update({ parameters })}
                error={getFieldState('script.parameters', formState).error?.message} />
            <ScriptCodeEditor language={script.language} code={script.code} onChange={(code) => update({ code })} isReadOnly={isReadOnly}
                impureCalls={impureCalls} result={testRun.result}
                error={getFieldState('script.code', formState).error?.message} />
        </div>
    )

    return (
        <div style={{ width: '100%' }} data-testid="global-variable-script-editor">
            {isReadOnly ? definition : (
                <Tabs
                    value={tab}
                    onChange={setTab}
                    items={[
                        { key: 'define', label: t('global-variable.script.tabs.define'), content: definition },
                        {
                            key: 'test',
                            label: t('global-variable.script.tabs.test'),
                            content: <ScriptTestRun parameters={script.parameters} testRun={testRun} onLocate={() => setTab('define')} />,
                        },
                    ]}
                />
            )}
        </div>
    )
}
