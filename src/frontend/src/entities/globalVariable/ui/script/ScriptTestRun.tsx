import type { ReactNode } from 'react'
import { Alert } from '@shared/ui/primitives/Alert'
import { Button } from '@shared/ui/primitives/Button'
import { Input } from '@shared/ui/primitives/Input'
import { Typography } from '@shared/ui/primitives/Typography'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import type { DetectedRef, ScriptParameterDraft } from '../../model/script'
import type { useScriptTestRun } from './useScriptTestRun'
import { ScriptTestResult } from './ScriptTestResult'

type Props = {
    parameters: ScriptParameterDraft[]
    refs: DetectedRef[]
    testRun: ReturnType<typeof useScriptTestRun>
}

const Field = ({ label, children }: { label: ReactNode; children: ReactNode }) => (
    <label style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 30%) 1fr', gap: 8, alignItems: 'center' }}>
        <code style={{ overflowWrap: 'anywhere' }}>{label}</code>
        {children}
    </label>
)

// References can't be resolved outside a run, so the user supplies their test values (contract §8).
export function ScriptTestRun({ parameters, refs, testRun }: Props) {
    const { t } = useI18n('entities')
    const named = parameters.filter((parameter) => parameter.name.trim() !== '')

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }} data-testid="global-variable-script-test">
            <Typography variant="title" as="h3">{t('global-variable.script.test.title')}</Typography>
            {named.length > 0 && <Typography variant="label" isSubtle>{t('global-variable.script.test.arguments')}</Typography>}
            {named.map((parameter) => (
                <Field key={parameter.name} label={parameter.name}>
                    <Input value={testRun.argumentTexts[parameter.name] ?? ''}
                        placeholder={parameter.required ? t('global-variable.script.test.requiredPlaceholder') : parameter.defaultText}
                        onChange={(event) => testRun.setArgument(parameter.name, event.target.value)}
                        testId={`global-variable-script-test-arg-${parameter.name}`} />
                </Field>
            ))}
            {refs.length > 0 && <Typography variant="label" isSubtle>{t('global-variable.script.test.refs')}</Typography>}
            {refs.map((ref) => (
                <Field key={ref.ref} label={ref.ref}>
                    <Input value={testRun.refTexts[ref.ref] ?? ''} placeholder="null"
                        onChange={(event) => testRun.setRef(ref.ref, event.target.value)}
                        testId={`global-variable-script-test-ref-${ref.ref}`} />
                </Field>
            ))}
            <Typography variant="caption" isSubtle>{t('global-variable.script.test.valueHint')}</Typography>
            <div>
                <Button type="primary" iconLeft="play" loading={testRun.isRunning} onClick={() => void testRun.run()}
                    testId="global-variable-script-test-run">
                    {t('global-variable.script.test.run')}
                </Button>
            </div>
            {testRun.result && <ScriptTestResult result={testRun.result} />}
            {!testRun.result && !testRun.isRunning && (
                <Alert type="info" message={t('global-variable.script.test.notRun')} />
            )}
        </div>
    )
}
