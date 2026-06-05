import React, { useMemo, useState } from 'react'
import { Dialog } from '@shared/ui/primitives/Dialog'
import { Button } from '@shared/ui/primitives/Button'
import { Select } from '@shared/ui/primitives/Select'
import { FieldContainer } from '@shared/ui/primitives/FieldContainer'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { useFetchEntitiesQuery } from '@shared/api/genericApi'
import type { SubscriptionListItem } from '@entities/subscription/model/types'
import { getSubscriptionTypeLabel } from '@entities/subscription/model/subscriptionTypeLabels'

type ActivateSubscriptionDialogProps = {
    open: boolean
    onClose: () => void
    onActivate: (subscriptionId: string) => Promise<boolean>
    isSubmitting: boolean
}

export const ActivateSubscriptionDialog: React.FC<ActivateSubscriptionDialogProps> = ({
    open,
    onClose,
    onActivate,
    isSubmitting,
}) => {
    const { t } = useI18n('entities')
    const [selectedSubscription, setSelectedSubscription] = useState<string | undefined>(undefined)

    // The Select primitive's `asyncOptions` is only resolved by FormSelect (RHF),
    // so fetch the list here and pass plain options.
    const { data, isLoading, isFetching } = useFetchEntitiesQuery('/subs/all', { skip: !open })

    const options = useMemo(
        () =>
            ((data ?? []) as SubscriptionListItem[]).map((item) => ({
                label: getSubscriptionTypeLabel(item.subscriptionType),
                value: item._id,
            })),
        [data],
    )

    const handleActivate = async () => {
        if (!selectedSubscription) return
        const ok = await onActivate(selectedSubscription)
        if (ok) {
            setSelectedSubscription(undefined)
            onClose()
        }
    }

    return (
        <Dialog
            open={open}
            onClose={onClose}
            title={t('subscription.manage.activate.dialogTitle' as never)}
            width={440}
            footer={
                <>
                    <Button onClick={onClose} disabled={isSubmitting}>
                        {t('subscription.manage.activate.cancel' as never)}
                    </Button>
                    <Button
                        type="primary"
                        iconLeft="key"
                        loading={isSubmitting}
                        disabled={!selectedSubscription}
                        onClick={handleActivate}
                    >
                        {t('subscription.manage.activate.submit' as never)}
                    </Button>
                </>
            }
        >
            <FieldContainer>
                <Select
                    value={selectedSubscription}
                    onChange={(value) => setSelectedSubscription(value)}
                    placeholder={t('subscription.manage.activate.placeholder' as never)}
                    options={options}
                    isLoading={isLoading || isFetching}
                />
            </FieldContainer>
        </Dialog>
    )
}
