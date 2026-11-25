import { Navigate } from 'react-router-dom'
import { SetPasswordForm } from '@features/auth/ui/SetPasswordForm'
import { AppLogo } from '@features/branding/AppLogo'
import { Loading } from '@shared/ui/primitives/Loading/Loading'
import { useSignOutForReset } from './useSignOutForReset'

export default function SetPasswordPage() {
    const entry = useSignOutForReset()
    if (entry === 'nothingToReset') return <Navigate to="/" replace />

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                padding: 16,
                background: 'var(--color-background-app)',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 24,
                }}
            >
                <AppLogo />
                {entry === 'signingOut' ? <Loading size="md" /> : <SetPasswordForm />}
            </div>
        </div>
    )
}
