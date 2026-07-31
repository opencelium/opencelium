import React, { useRef, useState } from 'react'
import { Button } from '@shared/ui/primitives/Button'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import {
    useGetActiveSubscriptionQuery,
    useGetSyncStatusQuery,
} from '@entities/subscription/api/subscriptionApi'
import { useLicenseActions } from '@pages/SubscriptionPage/license-actions/useLicenseActions'
import { ActivateSubscriptionDialog } from '@pages/SubscriptionPage/license-actions/ActivateSubscriptionDialog'

const panelStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
}

export const LicenseActionsPanel: React.FC = () => {
    const { t } = useI18n('entities')
    const { data: syncStatus, isLoading: isSyncLoading } = useGetSyncStatusQuery()
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
    const isOnlineSync = syncStatus?.active === true
    const isFree = currentSubscription?.type === 'free'

    const pickFile =
        (handler: (file: File) => Promise<boolean>) =>
        async (event: React.ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0]
            event.target.value = ''
            if (!file) return
            await handler(file)
        }

    return (
        <div style={panelStyle}>
            <input
                ref={importLicenseInputRef}
                type="file"
                accept=".txt,text/plain"
                style={{ display: 'none' }}
                onChange={pickFile(importLicense)}
            />
            <input
                ref={extraOpsInputRef}
                type="file"
                accept=".txt,text/plain"
                style={{ display: 'none' }}
                onChange={pickFile(uploadExtraOps)}
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
                <Button type="primary" iconLeft="key" onClick={() => setIsActivateDialogOpen(true)}>
                    {t('subscription.manage.activate.button' as never)}
                </Button>
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

            <ActivateSubscriptionDialog
                open={isActivateDialogOpen}
                onClose={() => setIsActivateDialogOpen(false)}
                onActivate={activateSubscription}
                isSubmitting={pendingAction === 'activate'}
            />
        </div>
    )
}
