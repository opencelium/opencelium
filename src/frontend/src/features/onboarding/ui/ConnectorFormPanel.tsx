import { useRef } from 'react'
import { GenericCreateWizard } from '@/engine/entity/runtime/genererics/GenericCreateWizard'
import { IconButton } from '@shared/ui/primitives/IconButton'
import { Tooltip } from '@shared/ui/primitives/Tooltip'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { ONBOARDING_Z_INDEX } from '../model/types'
import { useSyncTourDialogHeight } from './useSyncTourDialogHeight'
import './connectorFormPanel.css'

const CONNECTOR_HIDDEN_FIELDS = ['invoker']

type ConnectorFormPanelProps = {
    /** Invoker the form opens pre-filled with; the panel is closed when null. */
    invokerName: string | null
    onClose: () => void
    onCreated: () => void
}

/**
 * The connector wizard docked beside the tour instead of replacing the page, so the
 * step the user came from stays on screen. It is the real wizard — validation, the
 * credential test and the master-password gate all belong to it — seeded through
 * `defaultValuesOverride` rather than a URL param, since nothing navigates here.
 */
export function ConnectorFormPanel({ invokerName, onClose, onCreated }: ConnectorFormPanelProps) {
    const { t } = useI18n('onboarding')
    const panelRef = useRef<HTMLElement | null>(null)
    // Hooks run unconditionally; the panel bails out below.
    useSyncTourDialogHeight(panelRef, invokerName !== null)
    if (invokerName === null) return null

    return (
        <aside
            ref={panelRef}
            className="onboarding-connector-panel"
            style={{ zIndex: ONBOARDING_Z_INDEX.sidePanel }}
            aria-label={t('content.connector.panelTitle', { name: invokerName })}
        >
            <header className="onboarding-connector-panel__header">
                <div>
                    <span className="onboarding-connector-panel__eyebrow">{t('content.connector.panelEyebrow')}</span>
                    <h2>{t('content.connector.panelTitle', { name: invokerName })}</h2>
                </div>
                <Tooltip content={t('actions.close')}>
                    <IconButton
                        type="text"
                        iconProps={{ name: 'close', size: 14 }}
                        onClick={onClose}
                        testId="onboarding-connector-panel-close"
                    />
                </Tooltip>
            </header>
            <div className="onboarding-connector-panel__body">
                <GenericCreateWizard
                    entityName="connector"
                    hideHeader
                    hideRecommendations
                    skipSuccessState
                    // Narrow host: steps run across the top as headers only.
                    compact
                    // The invoker is the row the user clicked, so the picker would
                    // only offer them a way to contradict themselves. Safe to hide
                    // despite being required — defaultValuesOverride supplies it.
                    hiddenFields={CONNECTOR_HIDDEN_FIELDS}
                    defaultValuesOverride={{ invoker: invokerName }}
                    onSuccess={onCreated}
                />
            </div>
        </aside>
    )
}
