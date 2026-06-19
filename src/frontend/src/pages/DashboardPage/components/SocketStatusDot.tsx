import { Tooltip } from '@shared/ui/primitives/Tooltip'
import { useSocket } from '@shared/api/socket/useSocket'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import type { SocketStatus } from '@shared/api/socket/types'

type Appearance = {
    color: string
    tooltipKey: 'statusConnected' | 'statusConnecting' | 'statusDisconnected'
}

const statusToAppearance = (status: SocketStatus): Appearance => {
    switch (status) {
        case 'connected':
            return { color: 'var(--color-status-success-fg)', tooltipKey: 'statusConnected' }
        case 'idle':
        case 'connecting':
            return { color: 'var(--color-status-warning-fg)', tooltipKey: 'statusConnecting' }
        case 'disconnected':
        case 'error':
            return { color: 'var(--color-status-error-fg)', tooltipKey: 'statusDisconnected' }
        default: {
            const _exhaustive: never = status
            return _exhaustive
        }
    }
}

export function SocketStatusDot() {
    const { status } = useSocket()
    const { t } = useI18n('dashboard')
    const { color, tooltipKey } = statusToAppearance(status)

    return (
        <Tooltip content={t(`connection.${tooltipKey}`)}>
            <span
                style={{
                    display: 'inline-block',
                    width: 9,
                    height: 9,
                    borderRadius: 9,
                    background: color,
                    boxShadow: `0 0 0 3px color-mix(in srgb, ${color} 25%, transparent)`,
                    flexShrink: 0,
                }}
            />
        </Tooltip>
    )
}
