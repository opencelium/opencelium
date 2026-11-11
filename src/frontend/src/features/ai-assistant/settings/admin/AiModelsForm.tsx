import { useWatch, type Control } from 'react-hook-form'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { Button } from '@shared/ui/primitives/Button'
import { Card } from '@shared/ui/primitives/Card'
import type { AiModelRole, AiSettingsResponse } from '@features/ai-assistant/model/aiGateway.types'
import { AiSettingsState } from '../AiSettingsState'
import { AiFeatureModelOverrides } from './AiFeatureModelOverrides'
import { AiModelPicker } from './AiModelPicker'
import type { AiSettingsFormValues } from './aiSettingsForm.schema'
import { isInstalled } from './aiSettingsForm.utils'
import { useAiFeatureLabel } from './useAiFeatureLabel'

const ROLES: AiModelRole[] = ['workflowModel', 'helpModel', 'lightModel', 'commandModel']

type Props = {
    control: Control<AiSettingsFormValues>
    data: AiSettingsResponse
    onResetToDefaults: () => void
}

/** One model per role, the features each one runs, and a model of its own for any single feature. */
export function AiModelsForm({ control, data, onResetToDefaults }: Props) {
    const { t } = useI18n('entities')
    const featureLabel = useAiFeatureLabel()
    const values = useWatch({ control })
    const featuresOf = (role: AiModelRole) => Object.entries(data.featureRoles)
        .filter(([id, featureRole]) => featureRole === role && !values.featureModels?.[id as keyof typeof data.featureRoles])
        .map(([id]) => featureLabel(id))

    return (
        <Card title={t('ai-settings.admin.models.title')} testId="ai-settings-admin-models"
            extra={<Button type="link" onClick={onResetToDefaults} testId="ai-settings-reset-defaults">
                {t('ai-settings.admin.models.resetDefaults')}
            </Button>}>
            <div className="aiSettingsRoles">
                {ROLES.map((role) => {
                    const model = values[role] ?? ''
                    const features = featuresOf(role)
                    return (
                        <div key={role} className="aiSettingsRole" data-testid={`ai-settings-role-${role}`}>
                            <div className="aiSettingsRoleHeader">
                                <span className="aiSettingsFieldLabel">{t(`ai-settings.admin.models.roles.${role}`)}</span>
                                <AiModelPicker control={control} name={role} installed={data.installedModels}
                                    testId={`ai-settings-model-${role}`} />
                                {model && <AiSettingsState isOk={isInstalled(data.installedModels, model)}
                                    label={t(isInstalled(data.installedModels, model)
                                        ? 'ai-settings.models.installed' : 'ai-settings.models.notInstalled')} />}
                            </div>
                            <p className="aiSettingsNote">
                                {features.length ? features.join(' · ') : t('ai-settings.admin.models.noFeatures')}
                            </p>
                        </div>
                    )
                })}
            </div>
            <AiFeatureModelOverrides control={control} data={data} />
            <p className="aiSettingsNote">{t('ai-settings.admin.models.embed', { model: data.embedModel })}</p>
        </Card>
    )
}
