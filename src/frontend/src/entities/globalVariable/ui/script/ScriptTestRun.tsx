import { Alert } from '@shared/ui/primitives/Alert'
import { Button } from '@shared/ui/primitives/Button'
import { Tooltip } from '@shared/ui/primitives/Tooltip'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { PlaygroundHeader } from '@features/workflow/components/request-editor/enhancement/ScriptPlayground/PlaygroundHeader'
import { PlaygroundInput } from '@features/workflow/components/request-editor/enhancement/ScriptPlayground/PlaygroundInput'
import { PlaygroundOutput } from '@features/workflow/components/request-editor/enhancement/ScriptPlayground/PlaygroundOutput'
import { PlaygroundRunStatus } from '@features/workflow/components/request-editor/enhancement/ScriptPlayground/PlaygroundRunStatus'
import '@features/workflow/components/request-editor/enhancement/ScriptPlayground/ScriptPlayground.css'
import type { ScriptParameterDraft } from '../../model/script'
import { toRunResult } from './scriptTestMapping'
import { MISSING_INPUT, type useScriptTestRun } from './useScriptTestRun'

type Props = {
    parameters: ScriptParameterDraft[]
    testRun: ReturnType<typeof useScriptTestRun>
    onLocate: (line: number, column: number) => void
}

export function ScriptTestRun({ parameters, testRun, onLocate }: Props) {
    const { t } = useI18n('entities')
    const { t: tWorkflow } = useI18n('workflow')
    const named = parameters.filter((parameter) => parameter.name.trim() !== '')
    const { result } = testRun
    const isUnavailable = result?.error?.code === 'VALIDATION_UNAVAILABLE'
    const blockedReason = testRun.invalid.length > 0 ? tWorkflow('sandbox.invalidJson', { name: testRun.invalid[0] }) : undefined
    const argumentHint = (parameter: ScriptParameterDraft) =>
        parameter.required ? t('global-variable.script.test.requiredPlaceholder') : parameter.defaultText ? `= ${parameter.defaultText}` : ''

    return (
        <section
            className="scriptPlayground"
            data-testid="global-variable-script-test"
            onKeyDown={(event) => {
                if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
                    event.preventDefault()
                    void testRun.run()
                }
            }}
        >
            <PlaygroundHeader hasDocsLink={false} />
            {named.length > 0 && <h4>{t('global-variable.script.test.arguments')}</h4>}
            {named.map((parameter) => (
                <PlaygroundInput
                    key={parameter.name}
                    name={parameter.name}
                    reference={argumentHint(parameter)}
                    input={testRun.argumentInputs[parameter.name] ?? MISSING_INPUT}
                    isInvalid={testRun.invalid.includes(parameter.name)}
                    onChange={(input) => testRun.setArgument(parameter.name, input)}
                    missingHint={t('global-variable.script.test.argumentMissing')}
                />
            ))}
            <div className="scriptPlaygroundRunRow">
                <Tooltip content={blockedReason ?? tWorkflow('sandbox.shortcut')}>
                    <Button type="primary" iconLeft="play" disabled={testRun.isRunning || !!blockedReason}
                        onClick={() => void testRun.run()} testId="global-variable-script-test-run">
                        {tWorkflow(testRun.isRunning ? 'sandbox.running' : 'sandbox.run')}
                    </Button>
                </Tooltip>
                <PlaygroundRunStatus
                    status={testRun.isRunning ? 'running' : testRun.completedAt ? 'done' : 'idle'}
                    isStale={false}
                    completedAt={testRun.completedAt}
                    blockedReason={blockedReason}
                />
            </div>
            {isUnavailable && result?.error
                ? <Alert type="info" showIcon message={t('global-variable.script.errors.VALIDATION_UNAVAILABLE')} description={result.error.message} />
                : (
                    <PlaygroundOutput
                        result={result ? toRunResult(result, t) : null}
                        issues={[]}
                        isStale={false}
                        onLocate={onLocate}
                        hasConsole={false}
                        notes={[]}
                    />
                )}
        </section>
    )
}
