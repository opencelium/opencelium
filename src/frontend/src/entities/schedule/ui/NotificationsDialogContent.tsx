import { useEffect, useRef } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loading } from '@shared/ui/primitives/Loading/Loading'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { FormConstraintsProvider } from '@shared/form/FormConstraintsContext'
import { MultiRecordForm } from '@/engine/entity/runtime/genererics/MultiRecordForm'
import { scheduleNotificationDefinition } from '../notification/notification.definition'
import { useGetNotificationsQuery } from '../api/notificationApi'
import {
    emptyNotificationItem,
    fromNotification,
    notificationsFormConstraints,
    notificationsFormSchema,
    type NotificationItemFormValues,
    type NotificationsFormValues,
} from './notificationsForm'
import { NotificationActions } from './NotificationActions'
import { formatToolLabel } from './formatToolLabel'

type Props = {
    schedulerId: number
}

export function NotificationsDialogContent({ schedulerId }: Props) {
    const { t: tEntities } = useI18n('entities')

    const form = useForm<NotificationsFormValues>({
        resolver: zodResolver(notificationsFormSchema),
        defaultValues: { items: [] },
        mode: 'onSubmit',
    })

    const { data, isFetching } = useGetNotificationsQuery(schedulerId)

    const initializedRef = useRef(false)
    useEffect(() => {
        if (initializedRef.current || data === undefined) return
        form.reset({ items: data.map(fromNotification) })
        initializedRef.current = true
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data])

    const hasLoadedOnce = data !== undefined

    if (isFetching && !hasLoadedOnce) {
        return (
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 240,
                }}
            >
                <Loading />
            </div>
        )
    }

    return (
        <FormProvider {...form}>
            <FormConstraintsProvider constraints={notificationsFormConstraints}>
                <MultiRecordForm
                    definition={scheduleNotificationDefinition}
                    sectionId="main"
                    name="items"
                    header="schedule.notifications.dialogTitle"
                    subheader="schedule.notifications.subtitle"
                    addLabel="schedule.notifications.addButton"
                    emptyKey="schedule.notifications.empty"
                    defaultRecord={emptyNotificationItem}
                    getRecordLabel={(record) => {
                        const item = record as NotificationItemFormValues
                        return (
                            item.name ||
                            tEntities('schedule.notifications.unnamedItem')
                        )
                    }}
                    getRecordSubtitle={(record) => {
                        const item = record as NotificationItemFormValues
                        const eventTypeLabel = item.eventType
                            ? tEntities(
                                  `schedule.notifications.eventTypeOptions.${item.eventType}`,
                              )
                            : ''
                        const notificationTypeLabel = item.notificationType
                            ? formatToolLabel(item.notificationType)
                            : ''
                        return [eventTypeLabel, notificationTypeLabel]
                            .filter(Boolean)
                            .join(' | ')
                    }}
                    getRecordStatus={(record) => {
                        const item = record as NotificationItemFormValues
                        return item.notificationId != null ? 'finish' : 'process'
                    }}
                    renderActions={({ index, remove }) => (
                        <NotificationActions
                            index={index}
                            schedulerId={schedulerId}
                            onDeleted={remove}
                        />
                    )}
                />
            </FormConstraintsProvider>
        </FormProvider>
    )
}
