import { Alert } from '@shared/ui/primitives/Alert'
import { useSocket } from '@shared/api/socket/useSocket'
import { useI18n } from '@shared/i18n/hooks/useI18n'

export function ConnectionStatusAlert() {
    const { status } = useSocket()
    const { t } = useI18n('dashboard')

    if (status !== 'error' && status !== 'disconnected') return null

    return (
        <Alert
            type="error"
            showIcon
            message={t('connection.errorTitle')}
            description={t('connection.errorDescription')}
        />
    )
}
