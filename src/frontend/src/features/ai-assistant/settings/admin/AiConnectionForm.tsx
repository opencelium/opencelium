import { Controller, type Control, type FieldPath } from 'react-hook-form'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { Collapse } from '@shared/ui/primitives/Collapse'
import { Input } from '@shared/ui/primitives/Input'
import { AiSettingsField } from './AiSettingsField'
import { AI_SETTINGS_LIMITS, type AiSettingsFormValues } from './aiSettingsForm.schema'

type TextName = 'ollamaUrl' | 'speechUrl' | 'docsUrl'
type NumberName = keyof typeof AI_SETTINGS_LIMITS

const TEXT_FIELDS: TextName[] = ['ollamaUrl', 'speechUrl', 'docsUrl']
const NUMBER_FIELDS: NumberName[] = ['chatTimeoutMinutes', 'contextTokens', 'maxRepairAttempts']

/** Where the gateway finds Ollama, speech to text and the docs, and its limits; folded away, rarely changed. */
export function AiConnectionForm({ control }: { control: Control<AiSettingsFormValues> }) {
    const { t } = useI18n('entities')
    const errorText = (code: string | undefined, name: FieldPath<AiSettingsFormValues>) => {
        if (!code) return undefined
        const limits = name in AI_SETTINGS_LIMITS ? AI_SETTINGS_LIMITS[name as NumberName] : undefined
        return t(`ai-settings.admin.errors.${code === 'url' || code === 'model' ? code : 'range'}`, limits ?? {})
    }

    const content = (
        <div className="aiSettingsFields">
            {TEXT_FIELDS.map((name) => (
                <Controller key={name} control={control} name={name} render={({ field, fieldState }) => (
                    <AiSettingsField label={t(`ai-settings.admin.connection.${name}`)}
                        hint={name === 'speechUrl' ? t('ai-settings.admin.connection.speechUrlHint') : undefined}
                        error={errorText(fieldState.error?.message, name)}>
                        <Input value={field.value} error={Boolean(fieldState.error)} testId={`ai-settings-${name}`}
                            onChange={(event) => field.onChange(event.target.value)} />
                    </AiSettingsField>
                )} />
            ))}
            {NUMBER_FIELDS.map((name) => (
                <Controller key={name} control={control} name={name} render={({ field, fieldState }) => (
                    <AiSettingsField label={t(`ai-settings.admin.connection.${name}`)}
                        error={errorText(fieldState.error?.message, name)}>
                        <Input type="number" value={Number.isFinite(field.value) ? String(field.value) : ''}
                            error={Boolean(fieldState.error)} testId={`ai-settings-${name}`}
                            onChange={(event) => field.onChange(event.target.value === '' ? Number.NaN : Number(event.target.value))} />
                    </AiSettingsField>
                )} />
            ))}
        </div>
    )

    return (
        <Collapse items={[{ key: 'connection', label: t('ai-settings.admin.connection.title'), content,
            testId: 'ai-settings-connection' }]} />
    )
}
