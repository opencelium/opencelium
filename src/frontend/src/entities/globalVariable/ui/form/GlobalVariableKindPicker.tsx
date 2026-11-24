import { useController, useFormContext } from 'react-hook-form'
import type { FieldOverrideProps } from '@/engine/entity/overrides/types'
import { FormControl } from '@shared/ui/form/FormControl'
import { Radio } from '@shared/ui/primitives/Radio'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { FORM_KINDS } from '../../model/form'
import { GlobalVariableKindBadge } from '../GlobalVariableKindBadge'

// The kind decides every other field and can't change after creation (FR-2).
export function GlobalVariableKindPicker({ field, mode }: FieldOverrideProps) {
    const { t } = useI18n('entities')
    const { control } = useFormContext()
    const { field: controller, fieldState } = useController({ name: field.name, control })
    const isLocked = mode !== 'create'

    return (
        <FormControl name={field.name} label={field.label} error={fieldState.error?.message}
            hint={isLocked ? 'global-variable.fields.kind.lockedHint' : 'global-variable.fields.kind.hint'}>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }} data-testid="global-variable-field-kind">
                {FORM_KINDS.map((kind) => (
                    <Radio
                        key={kind}
                        name="global-variable-kind"
                        value={kind}
                        checked={controller.value === kind}
                        disabled={isLocked}
                        onChange={() => controller.onChange(kind)}
                        label={
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                <GlobalVariableKindBadge kind={kind} isIconOnly />
                                {t(`global-variable.kind.${kind}.label`)}
                            </span>
                        }
                    />
                ))}
            </div>
        </FormControl>
    )
}
