import {NotificationRenderer} from "@features/notifications/NotificationRenderer.tsx";


export function NotificationProvider({ children }) {
    return (
        <>
            {children}
            <NotificationRenderer />
        </>
    )
}
