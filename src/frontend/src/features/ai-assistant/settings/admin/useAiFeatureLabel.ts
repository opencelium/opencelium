import { useI18n } from '@shared/i18n/hooks/useI18n'

/** A feature's name on the AI settings page; one newer than this app's translations still shows, by its id. */
export function useAiFeatureLabel() {
    const { t } = useI18n('entities')
    return (id: string) => {
        const key = `ai-settings.features.${id}`
        const label = t(key as never)
        return label === key ? id : label
    }
}
