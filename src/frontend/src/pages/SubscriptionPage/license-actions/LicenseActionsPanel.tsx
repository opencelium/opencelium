import React, { useRef, useState } from 'react'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { useGetActiveSubscriptionQuery } from '@entities/subscription/api/subscriptionApi'
import { useOnlineSyncStatus } from '@entities/subscription/model/useOnlineSyncStatus'
import {
    ONLINE_FEATURE_REASON_KEY,
    useServicePortalFeature,
} from '@entities/subscription/model/useOnlineFeature'
import { useOnlineStatus } from '@shared/network/useOnlineStatus'
import { useLicenseActions } from '@pages/SubscriptionPage/license-actions/useLicenseActions'
import { ActivateSubscriptionDialog } from '@pages/SubscriptionPage/license-actions/ActivateSubscriptionDialog'
import { notifyError } from '@shared/ui/feedback/notifyError'
import { useBreakpoints } from '@app/hooks/useBreakpoints'
import { LicenseActionButton } from '@pages/SubscriptionPage/license-actions/LicenseActionButton'

const MAX_TEXT_FILE_BYTES = 10 * 1024 * 1024
const SERVICE_PORTAL_URL = 'https://service.opencelium.io/login'
const ICON_ONLY_BELOW_WIDTH = 670

const panelStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
}

export const LicenseActionsPanel: React.FC = () => {
    const { t } = useI18n('entities')
    const { t: tCommon } = useI18n('common')
    const { isActive: isOnlineSync, isLoading: isSyncLoading } = useOnlineSyncStatus()
    // Activation is `POST /subs/{subId}`, which the backend answers by asking the
    // Service Portal for a license key — so it needs the portal reachable, not just
    // a connected browser. Every other action on this panel is served locally.
    const portal = useServicePortalFeature()
    const portalBlockReason = portal.state === 'unavailable' ? portal.reason : null
    // Opening the portal in a new tab is the browser's own request to the public
    // site — it needs connectivity, but none of the backend-side portal plumbing
    // `useServicePortalFeature` checks.
    const isOnline = useOnlineStatus()
    const { width } = useBreakpoints()
    const isIconOnly = width < ICON_ONLY_BELOW_WIDTH
    const { data: activeSubscription, isLoading: isSubscriptionLoading } =
        useGetActiveSubscriptionQuery()

    const importLicenseInputRef = useRef<HTMLInputElement>(null)
    const extraOpsInputRef = useRef<HTMLInputElement>(null)
    const [isActivateDialogOpen, setIsActivateDialogOpen] = useState(false)

    const {
        pendingAction,
        generateActivationRequest,
        importLicense,
        activateSubscription,
        uploadExtraOps,
        deleteLicense,
        activateFreeLicense,
    } = useLicenseActions()

    if (isSyncLoading || isSubscriptionLoading) return null

    const currentSubscription = activeSubscription?.subId ? activeSubscription : undefined
    const isFree = currentSubscription?.type === 'free'

    const pickTextFile =
        (action: 'importLicense' | 'extraOps', handler: (file: File) => Promise<boolean>) =>
        async (event: React.ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0]
            event.target.value = ''
            if (!file) return
            if (!file.name.toLowerCase().endsWith('.txt')) {
                notifyError(t(`subscription.manage.${action}.invalidType` as never))
                return
            }
            if (file.size > MAX_TEXT_FILE_BYTES) {
                notifyError(t(`subscription.manage.${action}.tooLarge` as never))
                return
            }
            await handler(file)
        }

    return (
        <div style={panelStyle}>
            <input
                ref={importLicenseInputRef}
                type="file"
                accept=".txt,text/plain"
                style={{ display: 'none' }}
                onChange={pickTextFile('importLicense', importLicense)}
            />
            <input
                ref={extraOpsInputRef}
                type="file"
                accept=".txt,text/plain"
                style={{ display: 'none' }}
                onChange={pickTextFile('extraOps', uploadExtraOps)}
            />

            {!isOnlineSync && (
                <>
                    <LicenseActionButton
                        type="primary"
                        icon="download"
                        label={t('subscription.manage.generateRequest.button' as never)}
                        isIconOnly={isIconOnly}
                        loading={pendingAction === 'generateRequest'}
                        onClick={generateActivationRequest}
                    />
                    <LicenseActionButton
                        icon="upload"
                        label={t('subscription.manage.importLicense.button' as never)}
                        isIconOnly={isIconOnly}
                        loading={pendingAction === 'importLicense'}
                        onClick={() => importLicenseInputRef.current?.click()}
                    />
                </>
            )}

            {isOnlineSync && (!currentSubscription || isFree) && (
                <LicenseActionButton
                    type="primary"
                    icon="key"
                    label={t('subscription.manage.activate.button' as never)}
                    isIconOnly={isIconOnly}
                    blockedReason={portalBlockReason ? tCommon(ONLINE_FEATURE_REASON_KEY[portalBlockReason]) : undefined}
                    loading={portal.state === 'checking'}
                    disabled={portal.state !== 'available'}
                    testId="license-activate"
                    onClick={() => setIsActivateDialogOpen(true)}
                />
            )}

            <LicenseActionButton
                icon="plus"
                label={t('subscription.manage.extraOps.button' as never)}
                isIconOnly={isIconOnly}
                loading={pendingAction === 'extraOps'}
                onClick={() => extraOpsInputRef.current?.click()}
            />

            {!currentSubscription && (
                <LicenseActionButton
                    icon="check"
                    label={t('subscription.manage.activateFree.button' as never)}
                    isIconOnly={isIconOnly}
                    loading={pendingAction === 'activateFree'}
                    onClick={activateFreeLicense}
                />
            )}

            {currentSubscription && !isFree && (
                <LicenseActionButton
                    icon="delete"
                    label={t('subscription.manage.deleteLicense.button' as never)}
                    isIconOnly={isIconOnly}
                    loading={pendingAction === 'deleteLicense'}
                    onClick={() => deleteLicense(currentSubscription.subId)}
                />
            )}

            {/* Tooltip renders its own wrapper span, so the auto margin that right-aligns
                this button has to sit outside it — that wrapper is the panel's flex item. */}
            <div style={{ marginLeft: 'auto' }}>
                <LicenseActionButton
                    icon="portal"
                    label={t('subscription.manage.servicePortal.button' as never)}
                    isIconOnly={isIconOnly}
                    blockedReason={isOnline ? undefined : tCommon(ONLINE_FEATURE_REASON_KEY.offline)}
                    disabled={!isOnline}
                    testId="license-service-portal"
                    onClick={() => window.open(SERVICE_PORTAL_URL, '_blank', 'noopener,noreferrer')}
                />
            </div>

            <ActivateSubscriptionDialog
                open={isActivateDialogOpen}
                onClose={() => setIsActivateDialogOpen(false)}
                onActivate={activateSubscription}
                isSubmitting={pendingAction === 'activate'}
            />
        </div>
    )
}
