import React, { useRef, useState } from 'react'
import { Button } from '@shared/ui/primitives/Button'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { useGetActiveSubscriptionQuery } from '@entities/subscription/api/subscriptionApi'
import { useOnlineSyncStatus } from '@entities/subscription/model/useOnlineSyncStatus'
import {
    ONLINE_FEATURE_REASON_KEY,
    useServicePortalFeature,
} from '@entities/subscription/model/useOnlineFeature'
import { useOnlineStatus } from '@shared/network/useOnlineStatus'
import { Tooltip } from '@shared/ui/primitives/Tooltip'
import { useLicenseActions } from '@pages/SubscriptionPage/license-actions/useLicenseActions'
import { ActivateSubscriptionDialog } from '@pages/SubscriptionPage/license-actions/ActivateSubscriptionDialog'
import { notifyError } from '@shared/ui/feedback/notifyError'

const MAX_TEXT_FILE_BYTES = 10 * 1024 * 1024
const SERVICE_PORTAL_URL = 'https://service.opencelium.io/login'

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
                    <Button
                        type="primary"
                        iconLeft="download"
                        loading={pendingAction === 'generateRequest'}
                        onClick={generateActivationRequest}
                    >
                        {t('subscription.manage.generateRequest.button' as never)}
                    </Button>
                    <Button
                        iconLeft="upload"
                        loading={pendingAction === 'importLicense'}
                        onClick={() => importLicenseInputRef.current?.click()}
                    >
                        {t('subscription.manage.importLicense.button' as never)}
                    </Button>
                </>
            )}

            {isOnlineSync && (!currentSubscription || isFree) && (
                <Tooltip content={portalBlockReason ? tCommon(ONLINE_FEATURE_REASON_KEY[portalBlockReason]) : ''}>
                    <Button
                        type="primary"
                        iconLeft="key"
                        loading={portal.state === 'checking'}
                        disabled={portal.state !== 'available'}
                        testId="license-activate"
                        onClick={() => setIsActivateDialogOpen(true)}
                    >
                        {t('subscription.manage.activate.button' as never)}
                    </Button>
                </Tooltip>
            )}

            <Button
                iconLeft="plus"
                loading={pendingAction === 'extraOps'}
                onClick={() => extraOpsInputRef.current?.click()}
            >
                {t('subscription.manage.extraOps.button' as never)}
            </Button>

            {!currentSubscription && (
                <Button
                    iconLeft="check"
                    loading={pendingAction === 'activateFree'}
                    onClick={activateFreeLicense}
                >
                    {t('subscription.manage.activateFree.button' as never)}
                </Button>
            )}

            {currentSubscription && !isFree && (
                <Button
                    iconLeft="delete"
                    loading={pendingAction === 'deleteLicense'}
                    onClick={() => deleteLicense(currentSubscription.subId)}
                >
                    {t('subscription.manage.deleteLicense.button' as never)}
                </Button>
            )}

            {/* Tooltip renders its own wrapper span, so the auto margin that right-aligns
                this button has to sit outside it — that wrapper is the panel's flex item. */}
            <div style={{ marginLeft: 'auto' }}>
                <Tooltip content={isOnline ? '' : tCommon(ONLINE_FEATURE_REASON_KEY.offline)}>
                    <Button
                        iconLeft="portal"
                        disabled={!isOnline}
                        testId="license-service-portal"
                        onClick={() => window.open(SERVICE_PORTAL_URL, '_blank', 'noopener,noreferrer')}
                    >
                        {t('subscription.manage.servicePortal.button' as never)}
                    </Button>
                </Tooltip>
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
