import { useEffect, useRef } from 'react'
import { message } from 'antd'
import { useSocket } from '@shared/api/socket/useSocket'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { errorBus } from '@shared/errors/api/errorBus'

/**
 * Surfaces live-socket transitions as toasts: a NETWORK error when the
 * connection drops, and a success message once it reconnects. The success
 * toast only fires after a prior drop, so the initial connect stays silent.
 * Fires once per transition and re-arms each cycle.
 */
export function useSocketConnectionNotifications() {
    const { status } = useSocket()
    const { t } = useI18n('success')
    const wasDown = useRef(false)

    useEffect(() => {
        const isDown = status === 'error' || status === 'disconnected'

        if (isDown) {
            if (!wasDown.current) {
                wasDown.current = true
                errorBus.emit({ type: 'NETWORK', messageKey: 'socketDisconnected' })
            }
            return
        }

        if (status === 'connected' && wasDown.current) {
            wasDown.current = false
            message.success(t('connection.reconnected'))
        }
    }, [status, t])
}
