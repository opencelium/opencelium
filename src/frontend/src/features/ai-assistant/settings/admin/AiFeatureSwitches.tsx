import { Controller, type Control } from 'react-hook-form'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { Card } from '@shared/ui/primitives/Card'
import { Switch } from '@shared/ui/primitives/Switch'
import { SWITCHABLE_AI_FEATURES } from '@features/ai-assistant/model/aiFeatures'
import type { AiFeatureId } from '@features/ai-assistant/model/aiGateway.types'
import type { AiSettingsFormValues } from './aiSettingsForm.schema'
import { useAiFeatureLabel } from './useAiFeatureLabel'

type Group = keyof typeof SWITCHABLE_AI_FEATURES

/** Which AI features everyone gets; a feature that is off has its button hidden. */
export function AiFeatureSwitches({ control }: { control: Control<AiSettingsFormValues> }) {
    const { t } = useI18n('entities')
    const featureLabel = useAiFeatureLabel()
    return (
        <Card title={t('ai-settings.admin.features.title')} testId="ai-settings-admin-features">
            <Controller control={control} name="disabledFeatures" render={({ field }) => {
                const disabled = new Set<AiFeatureId>(field.value)
                const toggle = (id: AiFeatureId, isOn: boolean) => {
                    const next = new Set(disabled)
                    if (isOn) next.delete(id)
                    else next.add(id)
                    field.onChange([...next])
                }
                return (
                    <>
                        {(Object.keys(SWITCHABLE_AI_FEATURES) as Group[]).map((group) => (
                            <section key={group} className="aiSettingsFeatureGroup">
                                <h3 className="aiSettingsFieldLabel">{t(`ai-settings.admin.features.${group}`)}</h3>
                                <div className="aiSettingsSwitches">
                                    {SWITCHABLE_AI_FEATURES[group].map((id) => (
                                        <Switch key={id} checked={!disabled.has(id)} onChange={(isOn) => toggle(id, isOn)}
                                            text={{ on: featureLabel(id), off: featureLabel(id) }} testId={`ai-settings-feature-${id}`} />
                                    ))}
                                </div>
                            </section>
                        ))}
                    </>
                )
            }} />
            <p className="aiSettingsNote">{t('ai-settings.admin.features.hint')}</p>
        </Card>
    )
}
