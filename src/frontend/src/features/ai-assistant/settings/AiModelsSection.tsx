import { useI18n } from '@shared/i18n/hooks/useI18n'
import { Card } from '@shared/ui/primitives/Card'
import type { AiHealth } from '@features/ai-assistant/model/aiGateway.types'
import { AiSettingsState } from './AiSettingsState'

type ModelRow = { id: string; label: string; model: string; available: boolean }

/** The gateway's own table of which model each feature runs on, so a model changed in its env shows here as it is. */
export function AiModelsSection({ health }: { health: AiHealth }) {
    const { t } = useI18n('entities')
    const featureLabel = (id: string) => {
        const key = `ai-settings.features.${id}`
        const label = t(key as never)
        // A feature newer than this app's translations still shows, by its id.
        return label === key ? id : label
    }
    const rows: ModelRow[] = [
        ...(health.features ?? []).map(({ id, model, available }) => ({ id, label: featureLabel(id), model, available })),
        ...(health.embedModel ? [{ id: 'embed', label: t('ai-settings.models.embed'), ...health.embedModel, model: health.embedModel.name }] : []),
    ]
    return (
        <Card title={t('ai-settings.models.title')} testId="ai-settings-models">
            {rows.length === 0
                ? <p className="aiSettingsNote">{t('ai-settings.models.olderGateway')}</p>
                : (
                    <table className="aiSettingsRows">
                        <thead>
                            <tr><th>{t('ai-settings.models.feature')}</th><th>{t('ai-settings.models.model')}</th><th /></tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => (
                                <tr key={row.id} data-testid={`ai-settings-model-${row.id}`}>
                                    <td>{row.label}</td>
                                    <td className="aiSettingsModel">{row.model}</td>
                                    <td>
                                        <AiSettingsState isOk={row.available}
                                            label={t(row.available ? 'ai-settings.models.installed' : 'ai-settings.models.notInstalled')} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
        </Card>
    )
}
