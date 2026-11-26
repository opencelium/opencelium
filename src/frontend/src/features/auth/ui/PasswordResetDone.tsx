import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { Typography } from '@shared/ui/primitives/Typography'

const REDIRECT_SECONDS = 5

export function PasswordResetDone() {
    const { t } = useI18n('auth')
    const navigate = useNavigate()
    const [secondsLeft, setSecondsLeft] = useState(REDIRECT_SECONDS)

    useEffect(() => {
        const id = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000)
        return () => clearInterval(id)
    }, [])

    useEffect(() => {
        if (secondsLeft === 0) navigate('/login')
    }, [secondsLeft, navigate])

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
            <Typography variant="body">{t('setPassword.success.message')}</Typography>
            <Typography variant="body" isSubtle>
                {t('setPassword.success.redirect', { seconds: secondsLeft })}
            </Typography>
        </div>
    )
}
