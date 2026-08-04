export type NotificationType = 'success' | 'error' | 'info' | 'warning'

export type Notification = {
    id: string
    type: NotificationType
    messageKey: string
    params?: Record<string, unknown>
    createdAt: number
}
