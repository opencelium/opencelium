import { z } from 'zod'
import { buildZodSchema } from '@/engine/entity/builders/buildZodSchema'
import { buildDefaultValues } from '@/engine/entity/builders/buildDefaultValues'
import { buildConstraintsFromSchema } from '@shared/form/zodConstraints'
import type { FormConstraints, StringConstraints } from '@shared/form/types'
import { scheduleNotificationDefinition } from '@entities/schedule/notification/notification.definition'
import type {
    NotificationTemplate,
    ScheduleNotification,
} from '../model/notification.types'

export const NOTIFICATION_TYPE_EMAIL = 'email'
export const NOTIFICATION_TYPE_WEBHOOK = 'incoming_webhook'

const policyContextStub = {
    user: { id: 0, roles: [], permissions: [] },
}

const baseItemSchema = buildZodSchema(scheduleNotificationDefinition, policyContextStub)

export const notificationItemSchema = baseItemSchema.superRefine((value, ctx) => {
    const item = value as {
        notificationType?: string
        recipientsEmails?: unknown[]
        recipientsWebhook?: string
    }
    if (item.notificationType === NOTIFICATION_TYPE_EMAIL) {
        if (!Array.isArray(item.recipientsEmails) || item.recipientsEmails.length === 0) {
            ctx.addIssue({
                path: ['recipientsEmails'],
                code: z.ZodIssueCode.custom,
                message: 'schedule.notifications.errors.recipientsEmailsRequired',
            })
        }
        return
    }
    if (item.notificationType === NOTIFICATION_TYPE_WEBHOOK) {
        if (!item.recipientsWebhook || item.recipientsWebhook.trim().length === 0) {
            ctx.addIssue({
                path: ['recipientsWebhook'],
                code: z.ZodIssueCode.custom,
                message: 'schedule.notifications.errors.webhookUrlRequired',
            })
        }
    }
})

export const notificationsFormSchema = z.object({
    items: z.array(notificationItemSchema),
})

const baseItemConstraints: FormConstraints = buildConstraintsFromSchema(
    baseItemSchema as never,
    scheduleNotificationDefinition,
)

export const notificationsFormConstraints: FormConstraints = new Proxy(
    baseItemConstraints as Record<string, StringConstraints>,
    {
        get(target, prop) {
            if (typeof prop !== 'string') {
                return Reflect.get(target, prop)
            }
            const stripped = prop.replace(/^items\.\d+\./, '')
            return target[stripped]
        },
    },
) as FormConstraints

export type NotificationItemFormValues = {
    notificationId?: number
    name: string
    eventType: 'pre' | 'post' | 'alert'
    notificationType: string
    templateId: number | null
    recipientsEmails: string[]
    recipientsWebhook: string
}

export type NotificationsFormValues = {
    items: NotificationItemFormValues[]
}

const definitionDefaults = buildDefaultValues(scheduleNotificationDefinition) as Record<
    string,
    unknown
>

export const emptyNotificationItem: NotificationItemFormValues = {
    ...(definitionDefaults as object),
    name: (definitionDefaults.name as string) ?? '',
    eventType: (definitionDefaults.eventType as 'pre' | 'post' | 'alert') ?? 'post',
    notificationType: (definitionDefaults.notificationType as string) ?? '',
    templateId: null,
    recipientsEmails: [],
    recipientsWebhook: (definitionDefaults.recipientsWebhook as string) ?? '',
}

export const fromNotification = (
    notification: ScheduleNotification,
): NotificationItemFormValues => ({
    notificationId: notification.notificationId,
    name: notification.name,
    eventType: notification.eventType,
    notificationType: notification.notificationType,
    templateId: notification.template?.templateId ?? null,
    recipientsEmails:
        notification.notificationType === NOTIFICATION_TYPE_EMAIL
            ? notification.recipients
            : [],
    recipientsWebhook:
        notification.notificationType === NOTIFICATION_TYPE_WEBHOOK
            ? notification.recipients[0] ?? ''
            : '',
})

export const toApiPayload = (
    item: NotificationItemFormValues,
    schedulerId: number,
    templates: NotificationTemplate[],
) => {
    const template = templates.find((t) => t.templateId === item.templateId)
    return {
        schedulerId,
        name: item.name,
        eventType: item.eventType,
        notificationType: item.notificationType,
        template: template
            ? { templateId: template.templateId, name: template.name }
            : { templateId: item.templateId as number, name: '' },
        recipients:
            item.notificationType === NOTIFICATION_TYPE_EMAIL
                ? item.recipientsEmails
                : [item.recipientsWebhook],
    }
}
