export type ScheduleNotificationEventType = 'pre' | 'post' | 'alert'

export type ScheduleNotificationTemplateRef = {
    templateId: number
    name: string
}

export type ScheduleNotification = {
    notificationId: number
    schedulerId: number
    name: string
    eventType: ScheduleNotificationEventType
    notificationType: string
    template: ScheduleNotificationTemplateRef
    recipients: string[]
}

export type ScheduleNotificationCreatePayload = Omit<ScheduleNotification, 'notificationId'>

export type ScheduleNotificationUpdatePayload = ScheduleNotification

export type NotificationToolsResponse = {
    result: string[]
}

export type NotificationTemplateContent = {
    body: string
    contentId: number
    language: string
    subject: string
}

export type NotificationTemplate = {
    templateId: number
    name: string
    type: string
    content: NotificationTemplateContent[]
}
