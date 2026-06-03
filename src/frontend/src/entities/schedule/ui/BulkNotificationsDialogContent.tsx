import { useMemo, useState } from 'react'
import { FormProvider, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { message } from 'antd'
import { Button } from '@shared/ui/primitives/Button'
import { EntityText } from '@shared/ui/primitives/Text'
import { Typography } from '@shared/ui/primitives/Typography'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { useFetchEntitiesQuery } from '@shared/api/genericApi'
import { FormConstraintsProvider } from '@shared/form/FormConstraintsContext'
import type { FormConstraints, StringConstraints } from '@shared/form/types'
import { PolicyProvider } from '@/engine/policy/PolicyReactContext'
import { FieldRenderer } from '@/engine/entity/runtime/FieldRenderer'
import { scheduleNotificationDefinition } from '../notification/notification.definition'
import { useCreateNotificationMutation } from '../api/notificationApi'
import type { NotificationTemplate } from '../model/notification.types'
import {
    baseItemConstraints,
    emptyNotificationItem,
    notificationItemSchema,
    toApiPayload,
    type NotificationItemFormValues,
} from './notificationsForm'

type Props = {
    schedulerIds: number[]
    onClose: () => void
    onCreated: () => void
}

type BulkFormValues = { notification: NotificationItemFormValues }

const bulkFormSchema = z.object({ notification: notificationItemSchema })

const POLICY_CONTEXT = { user: { id: 0, roles: [], permissions: [] } }

const bulkConstraints: FormConstraints = new Proxy(
    baseItemConstraints as Record<string, StringConstraints>,
    {
        get(target, prop) {
            if (typeof prop !== 'string') return Reflect.get(target, prop)
            return target[prop.replace(/^notification\./, '')]
        },
    },
) as FormConstraints

const SECTION_ID = 'main'

export function BulkNotificationsDialogContent({ schedulerIds, onClose, onCreated }: Props) {
    const { t: tEntities } = useI18n('entities')

    const form = useForm<BulkFormValues>({
        resolver: zodResolver(bulkFormSchema),
        defaultValues: { notification: emptyNotificationItem },
        mode: 'onSubmit',
    })

    const [createNotification] = useCreateNotificationMutation()
    const [isSubmitting, setIsSubmitting] = useState(false)

    const notificationType = useWatch({
        control: form.control,
        name: 'notification.notificationType',
    })

    const { data: templatesData } = useFetchEntitiesQuery(
        notificationType ? `/message/all/${notificationType}` : '',
        { skip: !notificationType },
    )
    const templates: NotificationTemplate[] = Array.isArray(templatesData)
        ? (templatesData as NotificationTemplate[])
        : []

    const section = useMemo(
        () => scheduleNotificationDefinition.sections.find((s) => s.id === SECTION_ID),
        [],
    )
    const fieldMap = useMemo(
        () => new Map(scheduleNotificationDefinition.fields.map((f) => [f.name, f])),
        [],
    )

    const handleCreate = async () => {
        const ok = await form.trigger('notification')
        if (!ok) return
        const item = form.getValues('notification')

        setIsSubmitting(true)
        try {
            const results = await Promise.allSettled(
                schedulerIds.map((schedulerId) =>
                    createNotification({
                        schedulerId,
                        body: toApiPayload(item, schedulerId, templates),
                    }).unwrap(),
                ),
            )
            const succeeded = results.filter((r) => r.status === 'fulfilled').length
            const failed = results.length - succeeded

            if (succeeded > 0) {
                message.success(
                    tEntities('schedule.notifications.bulk.success', { count: succeeded }),
                )
            }
            if (failed > 0) {
                message.error(
                    tEntities('schedule.notifications.bulk.partialError', { count: failed }),
                )
            }
            if (failed === 0) {
                onCreated()
                onClose()
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <PolicyProvider value={POLICY_CONTEXT}>
            <FormProvider {...form}>
                <FormConstraintsProvider constraints={bulkConstraints}>
                    <div style={{ display: 'grid', gap: 15, padding: 4 }}>
                        <div>
                            <Typography variant="title" as="h2">
                                {tEntities('schedule.notifications.bulk.title')}
                            </Typography>
                            <div style={{ color: '#888' }}>
                                <Typography variant="body">
                                    {tEntities('schedule.notifications.bulk.subtitle', {
                                        count: schedulerIds.length,
                                    })}
                                </Typography>
                            </div>
                        </div>

                        {section?.fields.map((fieldName) => {
                            const field = fieldMap.get(fieldName)
                            if (!field) return null
                            return (
                                <FieldRenderer
                                    key={fieldName}
                                    field={{ ...field, name: `notification.${fieldName}` }}
                                    mode="create"
                                />
                            )
                        })}

                        <div
                            style={{
                                marginTop: 12,
                                display: 'flex',
                                justifyContent: 'flex-end',
                                gap: 12,
                            }}
                        >
                            <Button onClick={onClose} disabled={isSubmitting}>
                                <EntityText i18nKey="schedule.notifications.cancel" />
                            </Button>
                            <Button type="primary" loading={isSubmitting} onClick={handleCreate}>
                                {tEntities('schedule.notifications.bulk.create', {
                                    count: schedulerIds.length,
                                })}
                            </Button>
                        </div>
                    </div>
                </FormConstraintsProvider>
            </FormProvider>
        </PolicyProvider>
    )
}
