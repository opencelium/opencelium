import { useState } from 'react'
import { Popover } from 'antd'
import { useNavigate } from 'react-router-dom'
import { Button } from '@shared/ui/primitives/Button'
import { Divider } from '@shared/ui/primitives/Divider'
import { Icon } from '@shared/ui/primitives/Icon'
import { IconButton } from '@shared/ui/primitives/IconButton'
import { Tooltip } from '@shared/ui/primitives/Tooltip'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { useIsAdmin } from '@features/auth/useIsAdmin'
import { useDashboardTourStore } from '@features/onboarding/dashboard-tour/model/dashboardTour.store'
import { ONBOARDING_RESTART_EVENT } from '@features/onboarding/model/types'
import type { IconName } from '@shared/ui/primitives/Icon/Icon.types'
import './helpMenu.css'

const DOCS_URL = 'https://docs.opencelium.io/en/prod/'
const SERVICE_PORTAL_URL = 'https://service.opencelium.io/login'
const DASHBOARD_ROUTE = '/'

/**
 * The top bar's help affordance: the manual, and a replay of the onboarding
 * and dashboard tours.
 *
 * Controlled `open` rather than antd's own trigger handling, because every
 * entry takes the user somewhere — a popover left standing would sit over the
 * tour it just started.
 */
export function HelpMenu() {
    const { t: tCommon } = useI18n('common')
    const navigate = useNavigate()
    const isAdmin = useIsAdmin()
    const [isOpen, setIsOpen] = useState(false)

    const openDocs = () => {
        setIsOpen(false)
        window.open(DOCS_URL, '_blank', 'noopener,noreferrer')
    }

    const openServicePortal = () => {
        setIsOpen(false)
        window.open(SERVICE_PORTAL_URL, '_blank', 'noopener,noreferrer')
    }

    // Same order as the palette's `help onboarding`: home first, so the tour finds
    // its anchors on the page rather than resolving against the previous route.
    const startOnboardingTour = () => {
        setIsOpen(false)
        void navigate(DASHBOARD_ROUTE)
        window.dispatchEvent(new Event(ONBOARDING_RESTART_EVENT))
    }

    // Same order as the palette's `help dashboard`: home first, so the tour finds
    // its anchors on the page rather than resolving against the previous route.
    const startDashboardTour = () => {
        setIsOpen(false)
        void navigate(DASHBOARD_ROUTE)
        useDashboardTourStore.getState().request()
    }

    return (
        <Popover
            trigger={['click']}
            open={isOpen}
            onOpenChange={setIsOpen}
            placement="bottomRight"
            arrow={false}
            // `overlayInnerStyle` is what the older action menus in this repo pass;
            // antd v6 deprecated it in favour of this.
            styles={{ container: { padding: 4 } }}
            content={
                <div className="topbar-help-menu">
                    {/* Both tours are admin-only, so for anyone else these entries
                        would open menu items that quietly do nothing. */}
                    {isAdmin && (
                        <>
                            <MenuEntry
                                icon="mouse"
                                label={tCommon('topbar.startOnboardingTour')}
                                onClick={startOnboardingTour}
                                testId="topbar-start-onboarding-tour"
                            />
                            <MenuEntry
                                icon="report-analytics"
                                label={tCommon('topbar.startDashboardTour')}
                                onClick={startDashboardTour}
                                testId="topbar-start-dashboard-tour"
                            />
                            <div className="topbar-help-menu__divider">
                                <Divider />
                            </div>
                        </>
                    )}
                    <MenuEntry
                        icon="docs"
                        label={tCommon('topbar.docs')}
                        onClick={openDocs}
                        testId="topbar-docs"
                    />
                    <MenuEntry
                        icon="portal"
                        label={tCommon('topbar.servicePortal')}
                        onClick={openServicePortal}
                        testId="topbar-service-portal"
                    />
                </div>
            }
        >
            {/*
              * The span is load-bearing: Popover injects its click handler and a ref
              * into its child, and the Tooltip primitive's props are a closed set
              * ({ content, placement, zIndex, maxWidth, children }) that drops both —
              * which left the icon inert. A real DOM node takes them.
              */}
            <span style={{ display: 'inline-flex' }}>
                <Tooltip content={tCommon('topbar.help')}>
                    <IconButton
                        size="xs"
                        type="text"
                        iconProps={{ name: 'help', color: 'primary' }}
                        testId="topbar-help"
                    />
                </Tooltip>
            </span>
        </Popover>
    )
}

type MenuEntryProps = {
    icon: IconName
    label: string
    onClick: () => void
    testId: string
}

function MenuEntry({ icon, label, onClick, testId }: MenuEntryProps) {
    return (
        <Button type="text" onClick={onClick} testId={testId}>
            <span className="topbar-help-menu__item">
                <Icon name={icon} size={16} color="primary" />
                <span>{label}</span>
            </span>
        </Button>
    )
}
