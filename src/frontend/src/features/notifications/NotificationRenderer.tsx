import {useI18n} from "@shared/i18n/hooks/useI18n.ts";
import {useNotificationStore} from "@features/notifications/model/notificationStore.ts";


export function NotificationRenderer() {
    const { notifications, remove } = useNotificationStore()
    const { t } = useI18n('auth')

    return (
        <>
            {notifications.map((n) => (
                <div key={n.id}>
                    {/* TEMPORARY UI, will be replaced later */}
                    <strong>{n.type.toUpperCase()}:</strong>{' '}
                    {t(n.messageKey, n.params)}
                    <button onClick={() => remove(n.id)}>×</button>
                </div>
            ))}
        </>
    )
}
