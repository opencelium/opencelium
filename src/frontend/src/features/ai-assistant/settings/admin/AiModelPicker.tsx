import { Controller, type Control, type FieldPath } from 'react-hook-form'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { Select } from '@shared/ui/primitives/Select'
import type { AiSettingsFormValues } from './aiSettingsForm.schema'
import { isInstalled, modelChoices } from './aiSettingsForm.utils'

/** The Select shows nothing for an empty value, so "use the role's model" needs a value of its own. */
const INHERIT = '__role-model__'

type Props = {
    control: Control<AiSettingsFormValues>
    name: FieldPath<AiSettingsFormValues>
    installed: string[]
    /** First option, for a feature that may follow its role's model; it is stored as an empty model. */
    inherit?: string
    testId: string
}

/** Picks one of the models Ollama has; a chosen model it lacks stays visible, marked, so it is not changed by accident. */
export function AiModelPicker({ control, name, installed, inherit, testId }: Props) {
    const { t } = useI18n('entities')
    return (
        <Controller control={control} name={name} render={({ field }) => {
            const value = typeof field.value === 'string' ? field.value : ''
            const options = modelChoices(installed, value ? [value] : []).map((model) => ({
                value: model,
                label: isInstalled(installed, model) ? model : t('ai-settings.admin.models.notInstalledOption', { model }),
            }))
            return (
                <Select<string> value={inherit !== undefined && !value ? INHERIT : value} testId={testId}
                    onChange={(next) => field.onChange(next === INHERIT ? '' : next)}
                    options={inherit === undefined ? options : [{ value: INHERIT, label: inherit }, ...options]}
                    sortOptions={false} />
            )
        }} />
    )
}
