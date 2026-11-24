import type { ReactNode } from 'react'
import { Button } from '@shared/ui/primitives/Button'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { NEW_FEATURES, type NewFeatureEntry, type NewFeatureId } from './newFeatures'
import { NewFeatureBadge } from './NewFeatureBadge'

type Props = {
    id: NewFeatureId
    title?: ReactNode
    onDismiss: () => void
}

export function NewFeatureCard({ id, title, onDismiss }: Props) {
    const { t } = useI18n('common')
    const entry: NewFeatureEntry = NEW_FEATURES[id]
    const heading = entry.titleKey ? t(entry.titleKey) : title
    return (
        <span className="newFeatureCard" data-testid={`new-feature-${id}-card`}>
            <span className="newFeatureCard__header">
                {heading && <span className="newFeatureCard__title">{heading}</span>}
                <NewFeatureBadge />
            </span>
            <span className="newFeatureCard__description">{t(entry.descriptionKey)}</span>
            {/* The popup is portalled, but React still bubbles its clicks to the
                wrapped control — without this, "Got it" would also trigger it. */}
            <span className="newFeatureCard__footer" onClick={event => event.stopPropagation()}>
                <Button type="link" onClick={onDismiss} testId={`new-feature-${id}-dismiss`}>
                    {t('newFeature.gotIt')}
                </Button>
            </span>
        </span>
    )
}
