import { Alert } from '@shared/ui/primitives/Alert'
import { Typography } from '@shared/ui/primitives/Typography'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import type { ValidateScriptResponse } from '../../model/types'

export function ScriptTestResult({ result }: { result: ValidateScriptResponse }) {
    const { t } = useI18n('entities')
    if (result.error) {
        const location = result.error.line ? t('global-variable.script.test.atLine', { line: result.error.line }) : ''
        return (
            <Alert
                type={result.error.code === 'VALIDATION_UNAVAILABLE' ? 'info' : 'error'}
                showIcon
                message={`${t(`global-variable.script.errors.${result.error.code}`, { defaultValue: result.error.code })} ${location}`.trim()}
                description={result.error.message}
            />
        )
    }
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }} data-testid="global-variable-script-test-result">
            <Alert type="success" showIcon
                message={t('global-variable.script.test.success', { type: result.resultJsonType, ms: result.durationMs })} />
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{JSON.stringify(result.result, null, 2)}</pre>
            {result.warnings.map((warning) => (
                <Typography key={`${warning.code}-${warning.ref}`} variant="caption" isSubtle>
                    {`${t(`global-variable.script.warnings.${warning.code}`)} (${warning.ref}${warning.line ? `, ${t('global-variable.script.test.atLine', { line: warning.line })}` : ''})`}
                </Typography>
            ))}
        </div>
    )
}
