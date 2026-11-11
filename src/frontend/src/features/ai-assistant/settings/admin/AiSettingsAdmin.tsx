import type { ReactNode } from 'react'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { Button } from '@shared/ui/primitives/Button'
import { LoadingOverlay } from '@shared/ui/primitives/Loading/LoadingOverlay'
import { AiConnectionForm } from './AiConnectionForm'
import { AiFeatureSwitches } from './AiFeatureSwitches'
import { AiModelsForm } from './AiModelsForm'
import { useAiSettingsAdmin } from './useAiSettingsAdmin'

/** What an admin changes for everyone: models, which AI features are on, and how the gateway reaches its services. */
export function AiSettingsAdmin({ onSaved, readOnly }: { onSaved: () => void; readOnly: ReactNode }) {
    const { t } = useI18n('entities')
    const admin = useAiSettingsAdmin({ onSaved })
    if (admin.isUnavailable) {
        return (
            <>
                {readOnly}
                <p className="aiSettingsNote" data-testid="ai-settings-admin-unavailable">{t('ai-settings.admin.unavailable')}</p>
            </>
        )
    }
    if (!admin.data) return null
    const { control } = admin.form
    return (
        <LoadingOverlay loading={admin.isSaving}>
            <form className="aiSettingsAdmin" data-testid="ai-settings-admin" onSubmit={(event) => void admin.save(event)}>
                <AiModelsForm control={control} data={admin.data} onResetToDefaults={admin.resetToDefaults} />
                <AiFeatureSwitches control={control} />
                <AiConnectionForm control={control} />
                <div className="aiSettingsActions">
                    <span className="aiSettingsNote">{t('ai-settings.admin.forEveryone')}</span>
                    <Button onClick={admin.discard} disabled={!admin.isDirty || admin.isSaving} testId="ai-settings-discard">
                        {t('ai-settings.admin.discard')}
                    </Button>
                    <Button type="primary" htmlType="submit" disabled={!admin.isDirty} loading={admin.isSaving}
                        testId="ai-settings-save">
                        {t('ai-settings.admin.save')}
                    </Button>
                </div>
            </form>
        </LoadingOverlay>
    )
}
