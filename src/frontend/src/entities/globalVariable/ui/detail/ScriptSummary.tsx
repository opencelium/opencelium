import React from 'react'
import { Typography } from '@shared/ui/primitives/Typography'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import type { ScriptVariable } from '../../model/types'

// Read-only view until the script editor arrives with the script kind (phase 2).
export const ScriptSummary: React.FC<{ script: ScriptVariable['script'] }> = ({ script }) => {
    const { t } = useI18n('entities')
    const parameters = script.parameters
        .map((parameter) => (parameter.required ? parameter.name : `${parameter.name}?`))
        .join(', ')
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Typography variant="body">
                <code>{`${script.language} (${parameters})`}</code>
            </Typography>
            {script.imports.length > 0 && (
                <Typography variant="caption" isSubtle>
                    {t('global-variable.detail.imports', { names: script.imports.join(', ') })}
                </Typography>
            )}
            <pre style={{ margin: 0, maxHeight: 320, overflow: 'auto', whiteSpace: 'pre-wrap' }}>{script.code}</pre>
        </div>
    )
}
