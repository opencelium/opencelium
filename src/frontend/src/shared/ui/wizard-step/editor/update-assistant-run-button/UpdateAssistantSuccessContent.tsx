import { useEffect, useState } from 'react'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { useAuth } from '@features/auth/useAuth'

const LOGOUT_COUNTDOWN_SECONDS = 5

type Props = {
    version?: string
}

export function UpdateAssistantSuccessContent({ version }: Props) {
    const { t } = useI18n('entities')
    const { logout } = useAuth()
    const [secondsLeft, setSecondsLeft] = useState(LOGOUT_COUNTDOWN_SECONDS)

    useEffect(() => {
        if (secondsLeft <= 0) {
            logout()
            return
        }
        const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000)
        return () => clearTimeout(timer)
    }, [secondsLeft, logout])

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
            <span>{t('update-assistant.update.success', { version: version ?? '' })}</span>
            <span style={{ color: 'var(--color-text-secondary)' }}>
                {t('update-assistant.update.successLogoutNotice', { count: secondsLeft })}
            </span>
        </div>
    )
}
