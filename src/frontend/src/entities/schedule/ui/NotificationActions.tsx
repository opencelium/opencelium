import { useFormContext } from 'react-hook-form'
import { message } from 'antd'
import { Button } from '@shared/ui/primitives/Button'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { useFetchEntitiesQuery } from '@shared/api/genericApi'
import { useDialog } from '@shared/ui/dialog/useDialog'
import type { NotificationTemplate } from '../model/notification.types'
import {
    useCreateNotificationMutation,
    useDeleteNotificationMutation,
    useUpdateNotificationMutation,
} from '../api/notificationApi'
import {
    fromNotification,
    toApiPayload,
    type NotificationsFormValues,
} from './notificationsForm'
import { NotificationDeleteConfirmFooter } from './NotificationDeleteConfirmFooter'

type Props = {
    index: number
    schedulerId: number
    onDeleted: (index: number) => void
}

export function NotificationActions({ index, schedulerId, onDeleted }: Props) {
    const { t: tEntities } = useI18n('entities')
    const dialog = useDialog()
    const { watch, setValue, getValues, trigger } =
        useFormContext<NotificationsFormValues>()
    const [createNotification, { isLoading: isCreating }] = useCreateNotificationMutation()
    const [updateNotification, { isLoading: isUpdating }] = useUpdateNotificationMutation()
    const [deleteNotification] = useDeleteNotificationMutation()

    const base = `items.${index}` as const
    const notificationType = watch(`${base}.notificationType`)
    const notificationId = watch(`${base}.notificationId`)
    const watchedSaveLabel = notificationId == null
        ? 'schedule.notifications.actions.create'
        : 'schedule.notifications.actions.update'

    const { data: templatesData } = useFetchEntitiesQuery(
        notificationType ? `/message/all/${notificationType}` : '',
        { skip: !notificationType },
    )
    const templates: NotificationTemplate[] = Array.isArray(templatesData)
        ? (templatesData as NotificationTemplate[])
        : []

    const handleSave = async () => {
        const ok = await trigger(`items.${index}` as never)
        if (!ok) return
        const item = getValues(`items.${index}`)
        const payload = toApiPayload(item, schedulerId, templates)
        try {
            if (notificationId == null) {
                const created = await createNotification({
                    schedulerId,
                    body: payload,
                }).unwrap()
                if (created?.notificationId != null) {
                    setValue(base as `items.${number}`, fromNotification(created), {
                        shouldDirty: false,
                    })
                    message.success(tEntities('schedule.notifications.created'))
                }
            } else {
                await updateNotification({
                    schedulerId,
                    notificationId,
                    body: { ...payload, notificationId },
                }).unwrap()
                message.success(tEntities('schedule.notifications.updated'))
            }
        } catch {
            // error surfaced by errorBus
        }
    }

    const handleDelete = () => {
        const item = getValues(`items.${index}`)
        const currentNotificationId = item?.notificationId
        if (currentNotificationId == null) {
            onDeleted(index)
            return
        }
        const performDelete = async () => {
            try {
                await deleteNotification({
                    schedulerId,
                    notificationId: currentNotificationId,
                }).unwrap()
                message.success(tEntities('schedule.notifications.deleted'))
                dialog.close()
                onDeleted(index)
            } catch {
                dialog.close()
            }
        }
        dialog.open({
            title: tEntities('schedule.notifications.confirmDelete.title'),
            content: (
                <p style={{ margin: 0 }}>
                    {tEntities('schedule.notifications.confirmDelete.message')}
                </p>
            ),
            footer: (
                <NotificationDeleteConfirmFooter
                    confirmText={tEntities('schedule.notifications.actions.delete')}
                    cancelText={tEntities('schedule.notifications.cancel')}
                    onCancel={() => dialog.close()}
                    onConfirm={performDelete}
                />
            ),
            width: 480,
        })
    }

    return (
        <>
            <Button
                color="danger"
                variant="outlined"
                onClick={handleDelete}
                disabled={isCreating || isUpdating}
            >
                {tEntities('schedule.notifications.actions.delete')}
            </Button>
            <Button type="primary" onClick={handleSave} loading={isCreating || isUpdating}>
                {tEntities(watchedSaveLabel)}
            </Button>
        </>
    )
}
