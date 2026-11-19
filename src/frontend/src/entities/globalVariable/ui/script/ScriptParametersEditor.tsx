import { Button } from '@shared/ui/primitives/Button'
import { Checkbox } from '@shared/ui/primitives/Checkbox'
import { Input } from '@shared/ui/primitives/Input'
import { Tooltip } from '@shared/ui/primitives/Tooltip'
import { Typography } from '@shared/ui/primitives/Typography'
import { DeleteIconButton } from '@shared/ui/actions/DeleteIconButton'
import { FormControl } from '@shared/ui/form/FormControl'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import type { ScriptParameterDraft } from '../../model/script'

type Props = {
    parameters: ScriptParameterDraft[]
    onChange: (parameters: ScriptParameterDraft[]) => void
    isReadOnly: boolean
    error?: string
}

// Parameters are fixed at every call site (FR-41), so this list is their only definition.
export function ScriptParametersEditor({ parameters, onChange, isReadOnly, error }: Props) {
    const { t } = useI18n('entities')
    const update = (index: number, patch: Partial<ScriptParameterDraft>) =>
        onChange(parameters.map((parameter, current) => (current === index ? { ...parameter, ...patch } : parameter)))

    return (
        <FormControl label="global-variable.script.parameters.label" error={error}
            hint="global-variable.script.parameters.hint" style={{ width: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }} data-testid="global-variable-script-parameters">
                {parameters.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr max-content 1fr max-content', gap: 8, alignItems: 'center' }}>
                        <Typography variant="caption" isSubtle>{t('global-variable.script.parameters.name')}</Typography>
                        <Typography variant="caption" isSubtle>{t('global-variable.script.parameters.required')}</Typography>
                        <Typography variant="caption" isSubtle>{t('global-variable.script.parameters.default')}</Typography>
                        <span />
                        {parameters.map((parameter, index) => (
                            <ParameterRow key={index} index={index} parameter={parameter} isReadOnly={isReadOnly}
                                onChange={(patch) => update(index, patch)}
                                onRemove={() => onChange(parameters.filter((_, current) => current !== index))} />
                        ))}
                    </div>
                )}
                {!isReadOnly && (
                    <div>
                        <Button iconLeft="plus" onClick={() => onChange([...parameters, { name: '', required: true, defaultText: '' }])}
                            testId="global-variable-script-parameter-add">
                            {t('global-variable.script.parameters.add')}
                        </Button>
                    </div>
                )}
            </div>
        </FormControl>
    )
}

type RowProps = {
    index: number
    parameter: ScriptParameterDraft
    isReadOnly: boolean
    onChange: (patch: Partial<ScriptParameterDraft>) => void
    onRemove: () => void
}

function ParameterRow({ index, parameter, isReadOnly, onChange, onRemove }: RowProps) {
    const { t } = useI18n('entities')
    return (
        <>
            <Input value={parameter.name} readOnly={isReadOnly} placeholder="created"
                onChange={(event) => onChange({ name: event.target.value })}
                testId={`global-variable-script-parameter-name-${index}`} />
            <Checkbox checked={parameter.required} disabled={isReadOnly}
                onChange={(isRequired: boolean) => onChange({ required: isRequired, ...(isRequired ? { defaultText: '' } : {}) })}
                testId={`global-variable-script-parameter-required-${index}`} />
            <Input value={parameter.defaultText} readOnly={isReadOnly || parameter.required}
                placeholder={parameter.required ? '' : t('global-variable.script.parameters.defaultPlaceholder')}
                onChange={(event) => onChange({ defaultText: event.target.value })}
                testId={`global-variable-script-parameter-default-${index}`} />
            {isReadOnly ? <span /> : (
                <Tooltip content={t('global-variable.script.parameters.remove')} placement="top">
                    <DeleteIconButton onClick={onRemove} testId={`global-variable-script-parameter-remove-${index}`} />
                </Tooltip>
            )}
        </>
    )
}
