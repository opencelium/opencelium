import type { EntityDefinition } from '@/engine/entity/EntityDefinition'
import type { NotificationToolsResponse } from '@entities/schedule/model/notification.types'
import { formatToolLabel } from '@entities/schedule/ui/formatToolLabel'

const baseKey = 'schedule.notifications'

export const scheduleNotificationDefinition: EntityDefinition = {
    name: 'scheduleNotification',

    fields: [
        {
            name: 'notificationId',
            type: 'number',
            ui: { component: 'input' },
        },
        {
            name: 'name',
            type: 'string',
            ui: {
                component: 'input',
                props: { labelKey: `${baseKey}.fields.name` },
            },
            validation: { required: true },
        },
        {
            name: 'eventType',
            type: 'string',
            defaultValue: 'post',
            ui: {
                component: 'select',
                overrideKey: 'scheduleNotificationEventType',
                props: { labelKey: `${baseKey}.fields.eventType` },
            },
            validation: {
                required: true,
                custom: [
                    {
                        validate: (value) =>
                            value === 'pre' || value === 'post' || value === 'alert',
                        message: `${baseKey}.errors.eventTypeInvalid`,
                    },
                ],
            },
        },
        {
            name: 'notificationType',
            type: 'string',
            ui: {
                component: 'select',
                props: {
                    labelKey: `${baseKey}.fields.notificationType`,
                    asyncOptions: {
                        url: '/message/tools/all',
                        map: (data: NotificationToolsResponse | string[]) => {
                            const list = Array.isArray(data) ? data : data?.result ?? []
                            return list.map((value) => ({
                                value,
                                label: formatToolLabel(value),
                            }))
                        },
                    },
                },
            },
            validation: { required: true },
        },
        {
            name: 'templateId',
            type: 'number',
            ui: {
                component: 'select',
                overrideKey: 'scheduleNotificationTemplate',
                props: { labelKey: `${baseKey}.fields.template` },
            },
            validation: { required: true },
        },
        {
            name: 'recipientsEmails',
            type: 'array',
            ui: {
                component: 'select',
                overrideKey: 'scheduleNotificationRecipientsEmails',
                props: { labelKey: `${baseKey}.fields.recipients` },
            },
        },
        {
            name: 'recipientsWebhook',
            type: 'string',
            ui: {
                component: 'input',
                overrideKey: 'scheduleNotificationRecipientsWebhook',
                props: { labelKey: `${baseKey}.fields.webhookUrl` },
            },
        },
    ],

    sections: [
        {
            id: 'main',
            fields: [
                'name',
                'eventType',
                'notificationType',
                'templateId',
                'recipientsEmails',
                'recipientsWebhook',
            ],
        },
    ],

    wizard: {
        steps: [
            {
                id: 'main',
                header: `${baseKey}.dialogTitle`,
                sectionIds: ['main'],
            },
        ],
    },
}
