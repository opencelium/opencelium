import { useI18n } from '@shared/i18n/hooks/useI18n'
import './newFeature.css'

export function NewFeatureBadge({ testId }: { testId?: string }) {
    const { t } = useI18n('common')
    return (
        <span className="newFeatureBadge" data-testid={testId}>
            {t('newFeature.label')}
        </span>
    )
}
