import { Button } from '@shared/ui/primitives/Button'
import { Checkbox } from '@shared/ui/primitives/Checkbox'
import { Input } from '@shared/ui/primitives/Input'
import { Tooltip } from '@shared/ui/primitives/Tooltip'
import { DeleteIconButton } from '@shared/ui/actions/DeleteIconButton'
import { FormControl } from '@shared/ui/form/FormControl'
import { FieldContainer } from '@shared/ui/primitives/FieldContainer'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import type { ScriptParameterDraft } from '../../model/script'
import './scriptParametersEditor.css'

type Props = {
    parameters: ScriptParameterDraft[]
    onChange: (parameters: ScriptParameterDraft[]) => void
    isReadOnly: boolean
    error?: string
}

// Parameters are fixed at every call site (FR-41), so this list is their only definition.
// Laid out like the data aggregator's arguments (FieldArrayEditor, compact variant).
export function ScriptParametersEditor({ parameters, onChange, isReadOnly, error }: Props) {
    const { t } = useI18n('entities')
    const update = (index: number, patch: Partial<ScriptParameterDraft>) =>
        onChange(parameters.map((parameter, current) => (current === index ? { ...parameter, ...patch } : parameter)))

    return (
        <div className="script-parameters" data-testid="global-variable-script-parameters">
            <label className="form-control__label">{t('global-variable.script.parameters.label')}</label>
            <FormControl error={error} hint="global-variable.script.parameters.hint">
                <FieldContainer>
                {parameters.length > 0 && (
                    <div className="script-parameters__row script-parameters__header">
                        <Tooltip content={t('global-variable.script.parameters.required')} placement="top">
                            <label className="form-control__label script-parameters__required">*</label>
                        </Tooltip>
                        <label className="form-control__label">{t('global-variable.script.parameters.name')}</label>
                        <label className="form-control__label">{t('global-variable.script.parameters.default')}</label>
                        <span />
                    </div>
                )}
                {parameters.map((parameter, index) => (
                    <ParameterRow key={index} index={index} parameter={parameter} isReadOnly={isReadOnly}
                        onChange={(patch) => update(index, patch)}
                        onRemove={() => onChange(parameters.filter((_, current) => current !== index))} />
                ))}
                {!isReadOnly && (
                    <div className="script-parameters__add">
                        <Button onClick={() => onChange([...parameters, { name: '', description: '', required: true, defaultText: '' }])}
                            testId="global-variable-script-parameter-add">
                            {t('global-variable.script.parameters.add')}
                        </Button>
                    </div>
                )}
                </FieldContainer>
            </FormControl>
        </div>
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
        <div className="script-parameters__row">
            <Tooltip content={t('global-variable.script.parameters.required')} placement="top">
                <div className="script-parameters__required">
                    <Checkbox checked={parameter.required} disabled={isReadOnly}
                        onChange={(isRequired: boolean) => onChange({ required: isRequired, ...(isRequired ? { defaultText: '' } : {}) })}
                        testId={`global-variable-script-parameter-required-${index}`} />
                </div>
            </Tooltip>
            <Input value={parameter.name} readOnly={isReadOnly} placeholder="created"
                onChange={(event) => onChange({ name: event.target.value })}
                testId={`global-variable-script-parameter-name-${index}`} />
            <Input value={parameter.defaultText} readOnly={isReadOnly} disabled={parameter.required}
                placeholder={parameter.required ? '' : t('global-variable.script.parameters.defaultPlaceholder')}
                onChange={(event) => onChange({ defaultText: event.target.value })}
                testId={`global-variable-script-parameter-default-${index}`} />
            {!isReadOnly && (
                <Tooltip content={t('global-variable.script.parameters.remove')} placement="top">
                    <DeleteIconButton onClick={onRemove} testId={`global-variable-script-parameter-remove-${index}`} />
                </Tooltip>
            )}
        </div>
    )
}
