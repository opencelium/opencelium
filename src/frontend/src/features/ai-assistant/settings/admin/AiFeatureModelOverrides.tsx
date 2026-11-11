import { useWatch, type Control } from 'react-hook-form'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { Collapse } from '@shared/ui/primitives/Collapse'
import type { AiFeatureId, AiSettingsResponse } from '@features/ai-assistant/model/aiGateway.types'
import { AiModelPicker } from './AiModelPicker'
import type { AiSettingsFormValues } from './aiSettingsForm.schema'
import { useAiFeatureLabel } from './useAiFeatureLabel'

type Props = { control: Control<AiSettingsFormValues>; data: AiSettingsResponse }

/** A model for a single feature instead of its role's; folded away, since most installations never need one. */
export function AiFeatureModelOverrides({ control, data }: Props) {
    const { t } = useI18n('entities')
    const featureLabel = useAiFeatureLabel()
    const values = useWatch({ control })
    const features = Object.keys(data.featureRoles) as AiFeatureId[]
    const count = features.filter((id) => values.featureModels?.[id]).length

    const content = (
        <table className="aiSettingsRows">
            <thead>
                <tr><th>{t('ai-settings.models.feature')}</th><th>{t('ai-settings.models.model')}</th></tr>
            </thead>
            <tbody>
                {features.map((id) => {
                    const role = data.featureRoles[id]
                    return (
                        <tr key={id}>
                            <td>{featureLabel(id)}</td>
                            <td className="aiSettingsOverrideModel">
                                <AiModelPicker control={control} name={`featureModels.${id}`} installed={data.installedModels}
                                    testId={`ai-settings-feature-model-${id}`}
                                    inherit={t('ai-settings.admin.models.inherit', {
                                        model: values[role] ?? '', role: t(`ai-settings.admin.models.roles.${role}`) })} />
                            </td>
                        </tr>
                    )
                })}
            </tbody>
        </table>
    )

    return (
        <Collapse items={[{ key: 'overrides', label: t('ai-settings.admin.models.overrides', { count }), content,
            testId: 'ai-settings-feature-models' }]} />
    )
}
