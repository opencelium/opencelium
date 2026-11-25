import type { ReactNode } from 'react'
import { Tooltip } from '@shared/ui/primitives/Tooltip'
import type { TooltipPlacement } from '@shared/ui/primitives/Tooltip/Tooltip.types'
import type { NewFeatureId } from './newFeatures'
import { NewFeatureBadge } from './NewFeatureBadge'
import { NewFeatureCard } from './NewFeatureCard'
import { useNewFeature } from './useNewFeature'
import './newFeature.css'

type Props = {
    id: NewFeatureId
    /** `dot` sits on the corner of an icon-only control; `pill` follows a text label. */
    variant?: 'dot' | 'pill'
    /**
     * The control's own tooltip text. NewFeature owns the Tooltip so the "new" card
     * replaces that one popup instead of a second tooltip stacking on top of it; it
     * also titles the card. Omit it for a control without a tooltip of its own (a labelled menu item).
     */
    tooltip?: ReactNode
    placement?: TooltipPlacement
    /** For a control inside a popup that stacks above the default tooltip layer. */
    zIndex?: number
    children: ReactNode
}

export function NewFeature({ id, variant = 'dot', tooltip, placement, zIndex, children }: Props) {
    const { isNew, dismiss } = useNewFeature(id)

    const content = isNew ? <NewFeatureCard id={id} title={tooltip} onDismiss={dismiss} /> : tooltip

    // The wrapper stays mounted once the badge is dismissed or the release moves on,
    // so dropping the badge never remounts the wrapped control.
    return (
        <Tooltip content={content} placement={placement} zIndex={zIndex}
            variant={isNew ? 'card' : 'default'} maxWidth={isNew ? 340 : undefined}>
            <span className="newFeature">
                {children}
                {isNew && (variant === 'dot'
                    ? <span className="newFeature__dot" data-testid={`new-feature-${id}`} />
                    : <NewFeatureBadge testId={`new-feature-${id}`} />)}
            </span>
        </Tooltip>
    )
}
